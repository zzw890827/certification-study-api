import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';

@Injectable()
export class CoreService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  /** 清空所有题目 */
  async clearAllQuestions(): Promise<void> {
    await this.questionModel.deleteMany({}).exec();
  }

  /** 批量插入题目 */
  async seedQuestions(docs: Partial<Question>[]): Promise<void> {
    await this.clearAllQuestions();
    await this.questionModel.insertMany(docs);
  }

  async count(): Promise<number> {
    return this.questionModel.countDocuments().exec();
  }
}
