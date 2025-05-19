import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(private configService: ConfigService) {
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

  // 可添加方法：验证 JWT、获取当前用户信息等
}
