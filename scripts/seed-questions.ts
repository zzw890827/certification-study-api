import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { QuestionService } from '../src/question/question.service';
import { Question } from '../src/question/schemas/question.schema';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // 初始化 Nest 上下文
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const questionService = appContext.get(QuestionService);

  // 读取并解析 JSON 文件
  const file = path.resolve(__dirname, './questions.json');
  const raw = fs.readFileSync(file, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  // 类型校验
  if (!Array.isArray(parsed)) {
    console.error('Seed 文件格式错误：应为数组');
    await appContext.close();
    process.exit(1);
  }
  const docs = parsed as Partial<Question>[];

  // 清空旧数据并插入
  await questionService.clearAll();
  const result = await questionService.insertMany(docs);
  console.log(`Seed 完成：共插入 ${result.length} 条题目`);

  await appContext.close();
}

bootstrap();
