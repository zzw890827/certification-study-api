import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  // 注入 MongooseModule，让我们可以在 Controller 中检查连接状态
  imports: [MongooseModule],
  controllers: [HealthController],
})
export class HealthModule {}
