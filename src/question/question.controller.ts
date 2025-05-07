import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { QuestionService } from './question.service';
import { Question } from './schemas/question.schema';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // 获取题目总数: GET /questions/count
  @Get('count')
  async getCount(): Promise<{ count: number }> {
    const total = await this.questionService.count();
    return { count: total };
  }

  // 获取指定索引的题目: GET /questions/question/:index
  // 使用 ParseIntPipe 验证 index 为整数
  @Get('question/:index')
  async getQuestion(
    @Param('index', ParseIntPipe) index: number,
  ): Promise<Question> {
    return this.questionService.findByIndex(index);
  }
}
