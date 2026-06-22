import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface AuditBlock {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  tenantId: string;
  hash: string;
  prevHash: string;
}

@Injectable()
export class AuditService {
  private lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Appends an event to the immutable log chain by hashing the details and the previous block hash
   */
  async logEvent(
    userId: string,
    action: string,
    module: string,
    details: string,
    tenantId: string
  ): Promise<AuditBlock> {
    const id = `audit-${crypto.randomBytes(8).toString('hex')}`;
    const timestamp = new Date().toISOString();

    // Create block string matching the client-side signature
    const blockString = `${id}|${timestamp}|${userId}|${action}|${module}|${details}|${tenantId}|${this.lastHash}`;
    
    // Hash block using SHA-256
    const hash = crypto.createHash('sha256').update(blockString).digest('hex');

    const newBlock: AuditBlock = {
      id,
      timestamp,
      userId,
      action,
      module,
      details,
      tenantId,
      hash,
      prevHash: this.lastHash,
    };

    // Roll hash forward
    this.lastHash = hash;

    // In a real system, this would be written to TimescaleDB or a secure append-only log table
    return newBlock;
  }
}
