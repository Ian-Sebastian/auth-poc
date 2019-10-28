import {
  Controller,
  Get,
  Header,
  Query,
  Req,
  UnauthorizedException,
  Options,
  UseGuards,
  Post,
  Request,
  Response,
} from '@nestjs/common';
import { DataService } from './data.service';
import { Request as IRequest, Response as IResponse } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './security/auth.service';

@Controller('data')
export class DataController {
  constructor(
    private readonly dataService: DataService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('authorize')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('object')
  getObjectResource() {
    return this.dataService.getObject();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
