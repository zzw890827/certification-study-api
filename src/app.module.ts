import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import * as dotenv from 'dotenv';

dotenv.config();

// 确保环境变量存在
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('环境变量 MONGO_URI 未定义，请在 .env 文件中设置');
}

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri), // 已确保 mongoUri 为 string
    QuestionModule,
    ExamModule,
  ],
})
export class AppModule {}
