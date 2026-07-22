import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(profile: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: profile.phone },
      select: { id: true },
    });

    if (existing) {
      const user = await this.prisma.user.update({
        where: { phone: profile.phone },
        data: profile,
        select: { id: true },
      });

      return { userId: user.id, created: false };
    }

    try {
      const user = await this.prisma.user.create({
        data: profile,
        select: { id: true },
      });

      return { userId: user.id, created: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const user = await this.prisma.user.update({
          where: { phone: profile.phone },
          data: profile,
          select: { id: true },
        });

        return { userId: user.id, created: false };
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        school: true,
        grade: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
