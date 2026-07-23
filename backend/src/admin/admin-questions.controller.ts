import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminQuestionsService } from './admin-questions.service';
import { SaveQuestionDto } from './dto/save-question.dto';

@Controller('api/admin/questions')
@UseGuards(AdminApiKeyGuard)
export class AdminQuestionsController {
  constructor(private readonly questionsService: AdminQuestionsService) {}

  @Get()
  getDraft() {
    return this.questionsService.getDraft();
  }

  @Post()
  create(@Body() question: SaveQuestionDto) {
    return this.questionsService.create(question);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() question: SaveQuestionDto) {
    return this.questionsService.update(id, question);
  }

  @Post('actions/publish')
  publish() {
    return this.questionsService.publish();
  }
}
