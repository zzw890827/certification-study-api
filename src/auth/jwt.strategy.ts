import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(config: ConfigService) {
    const region = config.get<string>('AWS_REGION');
    const poolId = config.get<string>('COGNITO_USER_POOL_ID');
    const endpoint =
      config.get<string>('COGNITO_ENDPOINT') ||
      `https://cognito-idp.${region}.amazonaws.com`;
    const jwksUri = `${endpoint}/${poolId}/.well-known/jwks.json`;
    const jwksClient = new JwksClient({ jwksUri });

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (req, rawToken, done) => {
        this.logger.debug(`Raw token received: ${rawToken}`);
        try {
          const token = rawToken as string;
          const [encodedHeader] = token.split('.');
          const headerJson = Buffer.from(encodedHeader, 'base64').toString(
            'utf8',
          );
          this.logger.debug(`Decoded JWT header: ${headerJson}`);
          const header = JSON.parse(headerJson) as { kid: string };
          if (!header.kid) {
            this.logger.error('JWT header missing kid');
            return done(new Error('JWT header missing kid'));
          }
          this.logger.debug(`JWT kid: ${header.kid}`);
          jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              this.logger.error('Error fetching signing key', err);
              return done(err || new Error('Signing key not found'));
            }
            const publicKey = key.getPublicKey();
            this.logger.debug('Successfully retrieved public key');
            done(null, publicKey);
          });
        } catch (e) {
          this.logger.error('Exception in secretOrKeyProvider', e as Error);
          done(e as Error);
        }
      },
      // issuer: `${endpoint}/${poolId}`,
      // audience: config.get<string>('COGNITO_CLIENT_ID'),
    };
    super(opts);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.log(`Initialized JwtStrategy with issuer ${opts.issuer}`);
  }

  validate(payload: JwtPayload): { userId: string; username: string } {
    this.logger.debug(`Validated payload: ${JSON.stringify(payload)}`);
    const { sub, username } = payload;
    if (!sub) {
      this.logger.error('Token payload missing sub');
      throw new UnauthorizedException('Token payload missing sub');
    }
    return { userId: sub, username };
  }
}
