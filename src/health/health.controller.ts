import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Connection, ConnectionStates } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Controller('health')
export class HealthController {
  constructor(
    // 注入 Mongoose 的默认 Connection，用来检查是否已连接
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  /**
   * GET /health
   * 返回：
   *  200 OK  如果应用已启动且数据库已连接
   *  503 Service Unavailable 如果数据库未连接
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    // Mongoose 连接状态：0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const readyState = this.mongoConnection.readyState;
    if (readyState === ConnectionStates.connected) {
      // 正常已连接
      return { status: 'ok' };
    } else {
      // 如果不是 1，就返回 503
      return {
        status: 'error',
        dbState: readyState,
      };
    }
  }
}
