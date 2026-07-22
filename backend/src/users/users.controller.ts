import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('registration')
  @HttpCode(200)
  register(@Body() profile: RegisterUserDto) {
    return this.usersService.register(profile);
  }
}
