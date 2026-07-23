import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { validateEnvironment } from './configuration';
import { DatabaseModule } from './database/database.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    QuestionnaireModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
