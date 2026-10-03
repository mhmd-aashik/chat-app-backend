import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema/index.js';

@Injectable()
export class DbService {
  public readonly db;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');

    const sql = neon(databaseUrl);

    this.db = drizzle(sql, {
      schema,
    });
  }
}
