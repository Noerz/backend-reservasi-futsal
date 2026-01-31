import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { RegisterAdminDto, LoginAdminDto } from './dto';
import { AdminJwtAuthGuard } from './guards';
import { CurrentAdmin } from './decorators';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterAdminDto) {
    return this.adminAuthService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginAdminDto) {
    return this.adminAuthService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AdminJwtAuthGuard)
  async getProfile(@CurrentAdmin() admin: any) {
    return this.adminAuthService.getProfile(admin.id);
  }
}
