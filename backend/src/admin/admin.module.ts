import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminQuestionsService } from './admin-questions.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule],
  controllers: [AdminController, AdminQuestionsController],
  providers: [AdminApiKeyGuard, AdminQuestionsService],
})
export class AdminModule {}
