import {
  Controller,
  Post,
  Get,
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

  /** 创建考试会话（仅登录用户可调用） */
  @Post()
  async createExam(
    @GetUser('userId') userId: string,
  ): Promise<{ examId: string; total: number }> {
    // 这里可以把 userId 传给 service 用于记录或权限检查
    return this.es.createExam();
  }

  /** 获取考试中的单题，不返回正确答案 */
  @Get(':examId/questions/:index')
  async getExamQuestion(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
  ): Promise<any> {
    return this.es.getExamQuestion(examId, index);
  }

  /** 提交答案，记录结果但不返回内容 */
  @Post(':examId/questions/:index/answer')
  @HttpCode(204)
  async submitAnswer(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() dto: SubmitAnswerDto,
  ): Promise<void> {
    await this.es.submitAnswer(examId, index, dto.selected);
  }

  /** 获取考试结果，包括正确率和每题情况 */
  @Get(':examId/result')
  async getExamResult(
    @GetUser('userId') userId: string,
    @Param('examId') examId: string,
  ): Promise<any> {
    return this.es.getExamResult(examId);
  }
}
