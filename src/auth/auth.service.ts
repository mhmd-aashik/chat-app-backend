import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import * as argon2 from 'argon2'

@Injectable()
export class AuthService {
 constructor(private readonly usersService: UsersService) {}

 async register(dto: RegisterDto) {
  const existingUser = await this.usersService.findByEmail(dto.email);

  if (existingUser) {
    throw new ConflictException('Email already registered');
  }

  const passwordHash = await argon2.hash(dto.password);

  return this.usersService.create({
    name: dto.name,
    email: dto.email,
    passwordHash,
  });
}
}
