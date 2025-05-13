import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './schemas/exam.schema';
import {
  Question,
  QuestionDocument,
} from '../question/schemas/question.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  /**
   * 创建考试会话
   * - 随机抽取 65 道题
   * - 返回考试 ID 与题目总数
   */
  async createExam(): Promise<{ examId: string; total: number }> {
    const samples = await this.questionModel.aggregate<{ _id: Types.ObjectId }>(
      [{ $sample: { size: 65 } }, { $project: { _id: 1 } }],
    );
    const questionIds = samples.map((s) => s._id);

    const exam = await this.examModel.create({ questionIds, answers: [] });
    const examId = (exam._id as Types.ObjectId).toHexString();
    return { examId, total: questionIds.length };
  }
}
