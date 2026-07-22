import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [AdminApiKeyGuard],
})
export class AdminModule {}
