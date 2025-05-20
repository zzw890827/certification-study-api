import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from '../core/schemas/question.schema';
import { CoreService } from '../core/core.service';

@Injectable()
export class PracticeService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private readonly coreService: CoreService,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async findByIndex(index: number): Promise<Question> {
    const docs = await this.questionModel.find().skip(index).limit(1).exec();
    if (!docs.length) throw new NotFoundException(`题目索引 ${index} 不存在`);
    return docs[0];
  }

  async count(): Promise<number> {
    return this.coreService.count();
  }
}
