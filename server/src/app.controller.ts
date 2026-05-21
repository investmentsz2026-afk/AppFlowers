import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { message: 'ApkExcel API is running' };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
