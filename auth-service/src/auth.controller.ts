import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpException,
  HttpStatus,
  Response,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as IResponse } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async authLogin(@Body() body: any, @Response() res: IResponse) {
    try {
      const tokenResponse: any = await this.authService.sdkCognitoLogin(body);
      res.cookie('jwt', tokenResponse.accessToken);
      res.send(tokenResponse);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('signup')
  async authRegister(@Body() body: any) {
    try {
      return await this.authService.awsCognitoRegisterUser(body);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
