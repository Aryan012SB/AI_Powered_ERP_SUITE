import { Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { DataController } from './data.controller';
import { MlController } from './ml/ml.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [DataController, MlController],
  providers: [AuditService],
})
export class AppModule {}
