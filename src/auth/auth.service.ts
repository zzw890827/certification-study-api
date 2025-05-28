import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    // 初始化 Cognito 客户端，支持本地 LocalStack 模拟
    const region = this.configService.get<string>('AWS_REGION');
    const endpoint = this.configService.get<string>('COGNITO_ENDPOINT');
    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      // 如果配置了本地 Mock 地址则使用，否则默认为 AWS 服务
      endpoint: endpoint || 'http://localhost:4566',
    });
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
    if (!userPoolId) {
      throw new Error('环境变量 COGNITO_USER_POOL_ID 未定义');
    }
    this.userPoolId = userPoolId;

    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new Error('环境变量 COGNITO_CLIENT_ID 未定义');
    }
    this.clientId = clientId;
  }

  /** 注册用户到 Cognito User Pool */
  async register(dto: RegisterDto): Promise<void> {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: dto.username,
      Password: dto.password,
      UserAttributes: [{ Name: 'email', Value: dto.email }],
    });
    await this.cognitoClient.send(command);
  }

  async confirmEmail(dto: ConfirmEmailDto): Promise<void> {
    const { username, code } = dto;
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: code,
    });
    try {
      await this.cognitoClient.send(command);
      await this.userModel
        .updateOne(
          { username: dto.username },
          {
            $setOnInsert: { username: dto.username, tokenInvalidBefore: null },
          },
          { upsert: true },
        )
        .exec();
      this.logger.log(`Local user record upserted for ${dto.username}`);
    } catch (err: unknown) {
      this.logger.error(
        'ConfirmSignUp error',
        err instanceof Error ? err : String(err),
      );
      const message =
        err instanceof Error ? err.message : 'Email confirmation failed';
      throw new BadRequestException(message);
    }
  }

  /** 用户登录，返回 Cognito JWT */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: dto.username,
        PASSWORD: dto.password,
      },
    });
    const response = await this.cognitoClient.send(command);
    if (!response.AuthenticationResult?.AccessToken) {
      throw new UnauthorizedException('登录失败');
    }
    return { access_token: response.AuthenticationResult.AccessToken };
  }

  async logout(accessToken: string): Promise<void> {
    const parts = accessToken.split('.');
    if (parts.length < 2) {
      throw new BadRequestException('Invalid JWT format');
    }
    try {
      const cmd = new GlobalSignOutCommand({ AccessToken: accessToken });
      await this.cognitoClient.send(cmd);
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson) as {
        sub: string; // Cognito 内部 ID
        username: string; // 你在登录时使用的用户名
        iat?: number;
      };
      const username = payload.username;
      this.logger.log(`Logout requested for user ${payload.sub}`);
      this.logger.debug(`Token iat: ${payload.iat}, now: ${Date.now()}`);
      // 3. 在本地数据库更新 tokenInvalidBefore
      const logoutTime = new Date();
      await this.userModel
        .updateOne({ username }, { tokenInvalidBefore: new Date() })
        .exec();

      this.logger.log(
        `User ${payload.username} tokenInvalidBefore set to ${logoutTime.toISOString()}`,
      );

      this.logger.log(
        `User ${username} logged out at ${new Date().toISOString()}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logout failed';
      this.logger.error(
        'Logout error',
        err instanceof Error ? err : String(err),
      );
      throw new BadRequestException(msg);
    }
  }
}
