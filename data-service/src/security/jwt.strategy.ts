import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from '../../../config';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

/**
 * Singleton class.
 * Provides static properties to persist in memory
 * so jwks cache can live somewhere.
 */
class KeyProviderWithJwksCache {
  static jwksClient: jwksClient.JwksClient;
  static validationCounter: number = 0;

  constructor() {
    KeyProviderWithJwksCache.jwksClient = jwksClient({
      jwksUri: config.cognito.jwskUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 36000000, // 10 hours, milliseconds
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async handler(req, rawJwtToken, done) {
    try {
      console.log('Singleton Test: ', {
        jwtsValidatedSoFar: KeyProviderWithJwksCache.validationCounter,
      });
      KeyProviderWithJwksCache.validationCounter += 1;

      const jwtTokenKeyId = (() => {
        const decoded: any = jwt.decode(rawJwtToken as string, {
          complete: true,
        });
        return decoded.header.kid;
      })();

      const signingKey = await new Promise((resolve, reject) => {
        console.time('Time taken to retrieve signing key');
        KeyProviderWithJwksCache.jwksClient.getSigningKey(
          jwtTokenKeyId,
          (err: Error, jwk: jwksClient.RsaSigningKey) => {
            if (err) {
              return reject(err);
            }
            console.timeEnd('Time taken to retrieve signing key');
            return resolve(jwk.rsaPublicKey);
          },
        );
      });
      console.log('PEM key for signature validation: ', { signingKey });
      done(null, signingKey);
    } catch (err) {
      console.error('Error logged:', JSON.stringify({ err }, null, 2));
      done(err, null);
    }
  }
}

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.jwt;
  }
  return token;
};

// tslint:disable-next-line: max-classes-per-file
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: new KeyProviderWithJwksCache().handler,
    };
    super(strategyOptions);
  }

  async validate(payload: any) {
    console.log(
      'Jwt decoded payload on passport validate function: ',
      JSON.stringify(payload, null, 2),
    );
    return {
      userId: payload.sub,
      username: payload.username,
      tokenPayload: payload,
    }; // Gets mounted in req.user
  }
}
