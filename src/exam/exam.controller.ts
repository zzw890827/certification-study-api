import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly es: ExamService) {}

  @Post()
  async createExam(
    @GetUser('userId') userId: string,
  ): Promise<{ examId: string; total: number }> {
    return this.es.createExam(userId);
  }

  @Get(':examId/questions/:index')
  async getExamQuestion(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
  ): Promise<any> {
    return this.es.getExamQuestion(userId, examId, index);
  }

  @Post(':examId/questions/:index/answer')
  @HttpCode(204)
  async submitAnswer(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() dto: SubmitAnswerDto,
  ): Promise<void> {
    await this.es.submitAnswer(userId, examId, index, dto.selected);
  }

  @Get(':examId/result')
  async getExamResult(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
  ): Promise<any> {
    return this.es.getExamResult(userId, examId);
  }

  @Delete()
  @HttpCode(204)
  async clearUserExams(@GetUser('userId') userId: string): Promise<void> {
    await this.es.clearAll(userId);
  }
}
