import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { Question } from '../core/schemas/question.schema';

@Controller('practice')
export class PracticeController {
  constructor(private readonly ps: PracticeService) {}

  @Get('/questions/count')
  async getCount(): Promise<{ count: number }> {
    return { count: await this.ps.count() };
  }

  @Get('question/:index')
  async getQuestion(
    @Param('index', ParseIntPipe) index: number,
  ): Promise<Question> {
    return this.ps.findByIndex(index);
  }
}
