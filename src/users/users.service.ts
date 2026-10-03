import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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

  async findAll() {
    return this.dbService.db.select().from(users);
  }
}
