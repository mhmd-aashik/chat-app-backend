import { Injectable } from '@nestjs/common';
import { eq, ne } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import { users } from '../db/schema.js';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService) {}

  async findByEmail(email: string) {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async findById(id: number) {
    const result = await this.dbService.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findOtherUsers(currentUserId: number) {
    return this.dbService.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(ne(users.id, currentUserId));
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const result = await this.dbService.db
      .insert(users)
      .values(data)
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    return result[0];
  }
}
