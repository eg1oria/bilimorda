import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

function handleBodyParserError(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    response.status(413).json({
      statusCode: 413,
      message: 'Payload Too Large',
    });
    return;
  }

  next(error);
}

export function configureApp(app: NestExpressApplication) {
  app.useBodyParser('json', { limit: '8kb' });
  app.use(handleBodyParserError);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
