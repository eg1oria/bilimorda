import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { QuestionnaireService } from './questionnaire.service';

function bearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

@Controller('api/questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get('attempt')
  getAttempt(
    @Headers('authorization') authorization: string | undefined,
    @Query('lang') language = 'ru',
  ) {
    return this.questionnaireService.getSession(
      bearerToken(authorization),
      language,
    );
  }

  @Put('answers/:questionId')
  saveAnswer(
    @Headers('authorization') authorization: string | undefined,
    @Param('questionId') questionId: string,
    @Body() answer: SaveAnswerDto,
  ) {
    return this.questionnaireService.saveAnswer(
      bearerToken(authorization),
      questionId,
      answer.value,
    );
  }

  @Post('complete')
  @HttpCode(200)
  complete(@Headers('authorization') authorization: string | undefined) {
    return this.questionnaireService.complete(bearerToken(authorization));
  }
}
