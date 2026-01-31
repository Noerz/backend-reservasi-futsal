import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDocumentation(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(this.appService.getDocumentation());
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
