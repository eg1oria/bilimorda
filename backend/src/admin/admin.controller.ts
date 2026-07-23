import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AdminApiKeyGuard } from './admin-api-key.guard';

@Controller('api/admin/users')
@UseGuards(AdminApiKeyGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const items = await this.usersService.findAll();

    return {
      items,
      total: items.length,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneAdmin(id);
  }
}
