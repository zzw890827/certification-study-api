import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';

export interface JwtPayload {
  sub: string;
  username: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    // 从环境变量读取 Cognito 配置
    const region = config.get<string>('AWS_REGION')!;
    const clientId = config.get<string>('AWS_CLIENT_ID')!;
    const userPoolId = config.get<string>('COGNITO_USER_POOL_ID')!;
    const endpoint = `https://cognito-idp.${region}.amazonaws.com`;

    // JWKS URL
    const jwksUri = `${endpoint}/${userPoolId}/.well-known/jwks.json`;
    const jwksClient = new JwksClient({ jwksUri });

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 动态从 JWKS 拉公钥
      secretOrKeyProvider: (req, token, done) => {
        this.logger.debug(`Cognito token received: ${token}`);
        try {
          const [h] = (token as string).split('.');
          const headerJson = Buffer.from(h, 'base64').toString('utf8');
          const header = JSON.parse(headerJson) as { kid: string };
          if (!header.kid) {
            this.logger.error('JWT header missing kid');
            // 错误时第二个参数传 undefined 而非 null
            return done(new Error('JWT header missing kid'), undefined);
          }
          jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              this.logger.error('Error fetching signing key', err);
              return done(err || new Error('Signing key not found'), undefined);
            }
            const pub = key.getPublicKey();
            this.logger.debug('Retrieved public key from JWKS');
            done(null, pub);
          });
        } catch (e) {
          this.logger.error('Exception in secretOrKeyProvider', e as Error);
          done(e as Error, undefined);
        }
      },
      issuer: `${endpoint}/${userPoolId}`,
      audience: clientId,
    };

    super(opts);
    this.logger.log(`JwtStrategy initialized (JWKS: ${jwksUri})`);
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: string; username: string }> {
    this.logger.debug(
      `Validating token for ${payload.sub}. Payload iat=${payload.iat}`,
    );
    this.logger.debug(`Token payload validated: ${JSON.stringify(payload)}`);
    if (!payload.sub) {
      throw new UnauthorizedException('Token missing sub');
    }
    const user = await this.userModel
      .findOne({ username: payload.username })
      .exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    this.logger.debug(
      `User.tokenInvalidBefore = ${user.tokenInvalidBefore?.toISOString()}`,
    );
    if (user.tokenInvalidBefore && payload.iat) {
      const issuedMs = payload.iat * 1000;
      if (issuedMs < user.tokenInvalidBefore.getTime()) {
        throw new UnauthorizedException('Token has been invalidated');
      }
    }

    return { userId: payload.sub, username: payload.username };
  }
}
