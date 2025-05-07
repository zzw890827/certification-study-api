import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  // 按索引返回单题
  async findByIndex(index: number): Promise<Question> {
    const docs = await this.questionModel
      .find()
      .sort({ _id: 1 })
      .skip(index)
      .limit(1)
      .exec();
    if (!docs.length) {
      throw new NotFoundException(`题目索引 ${index} 不存在`);
    }
    return docs[0];
  }

  // 返回题目总数
  async count(): Promise<number> {
    return this.questionModel.countDocuments().exec();
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async insertMany(data: Partial<Question>[]) {
    return this.questionModel.insertMany(data);
  }

  async clearAll() {
    return this.questionModel.deleteMany({});
  }
}
