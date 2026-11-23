import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './infrastructure/http/auth/Public';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}
