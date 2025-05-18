import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExamService } from '../src/exam/exam.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const examService = appContext.get(ExamService);
  await examService.clearAll();
  console.log('Seed 完成：exams 集合已清空');
  await appContext.close();
}

bootstrap();
