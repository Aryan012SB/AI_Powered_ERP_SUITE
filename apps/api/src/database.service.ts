import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db!: Database.Database;

  onModuleInit() {
    const dbPath = path.resolve(process.cwd(), 'erp_suite.sqlite');
    console.log(`Initializing SQLite database at: ${dbPath}`);
    this.db = new Database(dbPath);

    // Enforce WAL mode for fast writes and concurrent reads
    this.db.pragma('journal_mode = WAL');

    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        name TEXT NOT NULL,
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        tenantId TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS erp_state (
        tenantId TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
    `);

    // Seed default users if users table is empty
    const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (usersCount.count === 0) {
      console.log('Seeding initial users into SQLite database...');
      const insertUser = this.db.prepare(
        'INSERT OR IGNORE INTO users (name, email, password, tenantId) VALUES (?, ?, ?, ?)'
      );
      
      const seedUsers = [
        { name: 'Rohith Raj', email: 'rajuchaswik@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Prisha Jain', email: 'prishanileshjain@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Rutvee Bhut', email: 'rutveeb.15@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Radhey Mohan', email: 'rmpatidar98@gmail.com', password: 'password', tenantId: 't-amdox' },
        { name: 'Administrator', email: 'admin@amdox.io', password: 'password', tenantId: 't-amdox' },
      ];

      for (const u of seedUsers) {
        insertUser.run(u.name, u.email.toLowerCase(), u.password, u.tenantId);
      }
    }
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  getDatabase(): Database.Database {
    return this.db;
  }
}
