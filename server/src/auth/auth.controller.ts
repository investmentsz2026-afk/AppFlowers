import { Controller, Post, Body, Get, Put, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    console.log('Login request payload:', loginDto);
    try {
      const user = await this.authService.validateUser(loginDto);
      return this.authService.login(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error; // rethrow to let Nest handle status codes
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Req() req: any, @Body() body: { name?: string; email?: string; password?: string }) {
    return this.authService.updateProfile(req.user.id, body);
  }
}
