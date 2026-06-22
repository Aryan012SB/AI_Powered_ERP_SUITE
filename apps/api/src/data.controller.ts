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
    const row = await this.dbService.queryOne<{ data: string }>('SELECT data FROM erp_state WHERE tenantId = ?', [tenantId]);
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
    const jsonStr = JSON.stringify(data);
    
    // Upsert the state in SQLite / PostgreSQL
    await this.dbService.run(`
      INSERT INTO erp_state (tenantId, data) 
      VALUES (?, ?) 
      ON CONFLICT(tenantId) DO UPDATE SET data = EXCLUDED.data
    `, [tenantId, jsonStr]);

    return { status: 'success' };
  }
}
