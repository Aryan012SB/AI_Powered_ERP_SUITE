import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private sqliteDb?: Database.Database;
  private pgPool?: Pool;
  private usePostgres = false;

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('Connecting to PostgreSQL database using DATABASE_URL...');
      this.pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
      });
      this.usePostgres = true;

      // Verify connection
      try {
        const client = await this.pgPool.connect();
        console.log('Successfully connected to PostgreSQL.');
        client.release();
      } catch (err) {
        console.error('Failed to connect to PostgreSQL:', err);
        throw err;
      }
    } else {
      const dbPath = path.resolve(process.cwd(), 'erp_suite.sqlite');
      console.log(`DATABASE_URL not found. Falling back to local SQLite database at: ${dbPath}`);
      const DatabaseConstructor = require('better-sqlite3');
      const DbClass = DatabaseConstructor.default || DatabaseConstructor;
      this.sqliteDb = new DbClass(dbPath) as Database.Database;
      this.sqliteDb.pragma('journal_mode = WAL');
      this.usePostgres = false;
    }

    // Initialize tables
    await this.initializeTables();
    await this.seedInitialUsers();
  }

  private async initializeTables() {
    const usersTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        tenantId VARCHAR(255) NOT NULL
      );
    `;

    const erpStateTableSql = `
      CREATE TABLE IF NOT EXISTS erp_state (
        tenantId VARCHAR(255) PRIMARY KEY,
        data TEXT NOT NULL
      );
    `;

    await this.run(usersTableSql);
    await this.run(erpStateTableSql);
  }

  private async seedInitialUsers() {
    const countResult = await this.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM users');
    const count = countResult ? Number(countResult.count) : 0;
    
    if (count === 0) {
      console.log('Seeding initial users...');
      const seedUsers = [
        { name: 'Himanshu Devatwal', email: 'himanshudevatwal@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Rutvee Bhut', email: 'rutveeb.15@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Radhey Mohan', email: 'rmpatidar98@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Aryan Solanki', email: '112aryansolanki@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Administrator', email: 'admin@amdox.io', password: 'password', tenantId: 't-amdox' },
      ];

      for (const u of seedUsers) {
        await this.run(
          'INSERT INTO users (name, email, password, tenantId) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
          [u.name, u.email.toLowerCase(), u.password, u.tenantId]
        );
      }
    }

    // Ensure Himanshu Devatwal and Aryan Solanki are added, and old users are removed from existing database
    await this.run(
      'INSERT INTO users (name, email, password, tenantId) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
      ['Himanshu Devatwal', 'himanshudevatwal@gmail.com', 'password', 't-amdox']
    );
    await this.run(
      'INSERT INTO users (name, email, password, tenantId) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
      ['Aryan Solanki', '112aryansolanki@gmail.com', 'password', 't-amdox']
    );
    await this.run(
      'DELETE FROM users WHERE email = ?',
      ['prishanileshjain@gmail.com']
    );
    await this.run(
      'DELETE FROM users WHERE email = ?',
      ['rajuchaswik@gmail.com']
    );
  }

  async onModuleDestroy() {
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }

  // Helper to translate "?" query parameter style to "$1", "$2" for Postgres
  private formatSql(sql: string): string {
    if (!this.usePostgres) return sql;
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const formattedSql = this.formatSql(sql);
    if (this.usePostgres && this.pgPool) {
      const res = await this.pgPool.query(formattedSql, params);
      return res.rows as T[];
    } else if (this.sqliteDb) {
      return this.sqliteDb.prepare(formattedSql).all(params) as T[];
    }
    return [];
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    const formattedSql = this.formatSql(sql);
    if (this.usePostgres && this.pgPool) {
      await this.pgPool.query(formattedSql, params);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(formattedSql).run(params);
    }
  }
}
