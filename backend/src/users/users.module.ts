import { Module } from '@nestjs/common';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [QuestionnaireModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
