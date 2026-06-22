import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from './database.service';

@ApiTags('Data Persistence')
@Controller('data')
export class DataController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'Load persisted ERP state for a tenant' })
  @ApiResponse({ status: 200, description: 'Persisted ERP state loaded successfully.' })
  async getData(@Param('tenantId') tenantId: string) {
    const db = this.dbService.getDatabase();
    const row = db.prepare('SELECT data FROM erp_state WHERE tenantId = ?').get(tenantId) as { data: string } | undefined;
    if (row) {
      return JSON.parse(row.data);
    }
    return { status: 'empty' };
  }

  @Post(':tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Persist ERP state for a tenant' })
  @ApiResponse({ status: 200, description: 'ERP state persisted successfully.' })
  async saveData(@Param('tenantId') tenantId: string, @Body() data: any) {
    const db = this.dbService.getDatabase();
    const jsonStr = JSON.stringify(data);
    
    // Upsert the state in SQLite
    db.prepare(`
      INSERT INTO erp_state (tenantId, data) 
      VALUES (?, ?) 
      ON CONFLICT(tenantId) DO UPDATE SET data = excluded.data
    `).run(tenantId, jsonStr);

    return { status: 'success' };
  }
}
