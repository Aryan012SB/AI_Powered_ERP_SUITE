terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. VPC & Subnets
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "amdox-erp-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# 2. Kubernetes Cluster (EKS v1.31)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "amdox-erp-prod"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    core_nodes = {
      min_size     = 3
      max_size     = 10
      desired_size = 3
      instance_types = ["t3.xlarge"]
    }
  }
}

# 3. PostgreSQL Database (RDS Aurora Serverless v2)
resource "aws_rds_cluster" "postgresql" {
  cluster_identifier      = "amdox-erp-db-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "17.1"
  database_name           = "erp_db"
  master_username         = "erp_admin"
  master_password         = var.db_password
  backup_retention_period = 14
  preferred_backup_window = "02:00-03:00"
  vpc_security_group_ids  = [aws_security_group.db_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.db_subnet.name
  storage_encrypted       = true
}

resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "amdox-erp-db-inst-${count.index}"
  cluster_identifier = aws_rds_cluster.postgresql.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.postgresql.engine
  engine_version     = aws_rds_cluster.postgresql.engine_version
}

# 4. Redis Cluster (ElastiCache Redis 8)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "amdox-erp-cache"
  engine               = "redis"
  node_type            = "cache.t4g.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
}
