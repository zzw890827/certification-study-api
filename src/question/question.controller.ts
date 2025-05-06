import { Controller, Get, Param } from '@nestjs/common';
import { QuestionService } from './question.service';
import { Question } from './schemas/question.schema';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get(':index')
  async getQuestion(@Param('index') indexStr: string): Promise<Question> {
    const index = parseInt(indexStr, 10);
    return this.questionService.findByIndex(index);
  }
}
