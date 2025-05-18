import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  Body,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('exams')
export class ExamController {
  constructor(private readonly es: ExamService) {}

  // 创建考试会话: POST /exams
  @Post()
  async createExam(): Promise<{ examId: string; total: number }> {
    return this.es.createExam();
  }

  // 获取考试中的单题: GET /exams/:examId/questions/:index
  @Get(':examId/questions/:index')
  async getExamQuestion(
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.es.getExamQuestion(examId, index);
  }

  @Post(':examId/questions/:index/answer')
  @HttpCode(204)
  async submitAnswer(
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() dto: SubmitAnswerDto,
  ): Promise<void> {
    await this.es.submitAnswer(examId, index, dto.selected);
  }
  // 获取考试结果: GET /exams/:examId/result
  @Get(':examId/result')
  async getExamResult(@Param('examId') examId: string): Promise<{
    total: number;
    correctCount: number;
    accuracy: number;
    details: Array<{ index: number; questionId: string; correct: boolean }>;
  }> {
    return this.es.getExamResult(examId);
  }
}
