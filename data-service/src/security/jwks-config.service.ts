import { Injectable } from '@nestjs/common';
import {
  JwtService,
  JwtSecretRequestType,
  JwtOptionsFactory,
  JwtModuleOptions,
} from '@nestjs/jwt';
import { config } from '../../../config';
import * as jwkToPem from 'jwk-to-pem';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

interface IPublicKey {
  kid: string;
  pem: string;
}

interface ICognitoKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

@Injectable()
export class JwksConfigService implements JwtOptionsFactory {
  private keyChain: IPublicKey[];

  constructor() {
    // Nothing to do here
  }

  async createJwtOptions(): Promise<JwtModuleOptions> {
    this.keyChain = await this.getPublicKeys();
    console.log(
      'Public Keychain details:',
      JSON.stringify(this.keyChain, null, 2),
    );
    return {
      secretOrKeyProvider: this.secretOrKeyProviderHandler,
    };
  }

  async getPublicKeys(): Promise<IPublicKey[]> {
    /**
     * Cognito jwks rotation does not exists
     * @see https://forums.aws.amazon.com/message.jspa?messageID=747599
     * @see https://cognito-idp.us-east-1.amazonaws.com/us-east-1_tzl1JwgsS/.well-known/jwks.json
     */
    const client = jwksClient({
      jwksUri: config.cognito.jwskUri,
    });

    const keyDictionary = new Promise<IPublicKey[]>((resolve, reject) => {
      console.info('Loading Jwks ...');
      client.getKeys((err, keys: ICognitoKey[]) => {
        if (err) {
          reject(err);
        }
        const keyMap: IPublicKey[] = keys.map((jwk: ICognitoKey) => {
          return { kid: jwk.kid, pem: jwkToPem(jwk) };
        });
        resolve(keyMap);
      });
    });
    return await keyDictionary;
  }

  secretOrKeyProviderHandler = (
    requestType: JwtSecretRequestType,
    tokenOrPayload: string | object | Buffer,
    verifyOrSignOrOptions?: jwt.VerifyOptions | jwt.SignOptions,
  ) => {
    switch (requestType) {
      case JwtSecretRequestType.SIGN:
        throw new Error('No jwt sign allowed');
      case JwtSecretRequestType.VERIFY:
        const verificationRequestKeyId = (() => {
          const decoded: any = jwt.decode(tokenOrPayload as string, {
            complete: true,
          });
          return decoded.header.kid;
        })();

        const { pem: keyForVerification } = this.keyChain.find(key => {
          return key.kid === verificationRequestKeyId;
        });

        console.log('Verification Key: ', keyForVerification);

        return keyForVerification;
      default:
        throw new Error('Bad request');
    }
  };
}
