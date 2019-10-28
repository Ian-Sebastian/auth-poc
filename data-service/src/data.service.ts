import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { config } from '../../config';

@Injectable()
export class DataService {
  constructor(private readonly jwtService: JwtService) {
    // Nothing to do here
  }

  private async _validateToken(accessToken: string) {
    try {
      const decoded = await this.jwtService.verify(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getArray(accessToken: string): Promise<any[]> {
    try {
      const validTokenData = await this._validateToken(accessToken);
      if (validTokenData) {
        return [1, 2, 3, 4, 5];
      } else {
        throw new UnauthorizedException();
      }
    } catch (error) {
      throw error;
    }
  }

  getObject(): object {
    return {
      id: 'ju7cscdcsdcu3929cdjfvdfg',
      event: {
        location: [2.4356455, 23.74578],
        name: 'Big event',
        confirmed: false,
        population: 324,
      },
    };
  }
}
