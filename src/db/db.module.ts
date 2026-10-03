import { Module } from '@nestjs/common';
import { DbService } from './db.service.js';

@Module({
  providers: [DbService]
})
export class DbModule {}
