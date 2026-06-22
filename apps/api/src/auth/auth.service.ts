import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database.service';

export interface User {
  name: string;
  email: string;
  password?: string;
  tenantId: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DatabaseService) {}

  async register(name: string, email: string, password: string, tenantId: string): Promise<Omit<User, 'password'>> {
    const db = this.dbService.getDatabase();
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    db.prepare('INSERT INTO users (name, email, password, tenantId) VALUES (?, ?, ?, ?)').run(
      name,
      email.toLowerCase(),
      password,
      tenantId
    );

    return {
      name,
      email: email.toLowerCase(),
      tenantId,
    };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
    const db = this.dbService.getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate a simple mock JWT containing user metadata matching ErpContext structure
    const header = { alg: 'RS256', typ: 'JWT', kid: 'key-amdox-2026-v1' };
    const payload = {
      iss: `https://auth.amdox.io/realms/${user.tenantId}`,
      sub: `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
      aud: 'amdox-erp-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      tenant_id: user.tenantId,
      name: user.name,
      email: user.email,
      roles: ['SuperAdmin'],
      mfa_verified: false,
    };
    const signature = 'k_R2390a-Z2f_891eFJKW9A7B6C5D4e3f2g1h0i_j81K';
    const mockToken = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;

    return {
      user: {
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
      token: mockToken,
    };
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT name, email, tenantId FROM users').all() as Omit<User, 'password'>[];
  }

  async deleteUser(email: string): Promise<void> {
    const db = this.dbService.getDatabase();
    db.prepare('DELETE FROM users WHERE email = ?').run(email.toLowerCase());
  }
}
