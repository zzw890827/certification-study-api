import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<void> {
    await this.authService.register(dto);
  }

  @Post('confirm')
  async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<void> {
    await this.authService.confirmEmail(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request): Promise<void> {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader || Array.isArray(authHeader)) {
      throw new BadRequestException('Missing Authorization header');
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    await this.authService.logout(token);
  }
}
