import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { users } from '../db/schema.js';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService) {}

  async findAll() {
    return this.dbService.db.select().from(users);
  }
}
