import { Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { DataController } from './data.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [DataController],
  providers: [AuditService],
})
export class AppModule {}
