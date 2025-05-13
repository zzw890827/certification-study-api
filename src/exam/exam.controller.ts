import { Controller, Post } from '@nestjs/common';
import { ExamService } from './exam.service';

@Controller('exams')
export class ExamController {
  constructor(private readonly es: ExamService) {}

  // 创建考试会话: POST /exams
  @Post()
  async createExam(): Promise<{ examId: string; total: number }> {
    return this.es.createExam();
  }
}
