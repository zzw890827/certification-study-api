import { Injectable, NotFoundException } from '@nestjs/common';
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
  /**
   * 获取考试中的单题，不返回正确答案
   */
  async getExamQuestion(
    examId: string,
    index: number,
  ): Promise<Partial<Question>> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试会话不存在');
    if (index < 0 || index >= exam.questionIds.length) {
      throw new NotFoundException(`题目索引 ${index} 不存在`);
    }
    const qId = exam.questionIds[index];
    const question = await this.questionModel
      .findById(qId)
      .select('-correctAnswer')
      .lean()
      .exec();
    if (!question) throw new NotFoundException('题目不存在');
    return question;
  }

  /** 提交答案，记录结果，但不返回正确性 */
  async submitAnswer(
    examId: string,
    index: number,
    selected: string[],
  ): Promise<void> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试会话不存在');
    if (index < 0 || index >= exam.questionIds.length)
      throw new NotFoundException(`题目索引 ${index} 不存在`);
    const qId = exam.questionIds[index];
    const question = await this.questionModel.findById(qId).exec();
    if (!question) throw new NotFoundException('题目不存在');
    const correct = question.multiple
      ? selected.sort().join(',') === question.correctAnswer.sort().join(',')
      : selected[0] === question.correctAnswer[0];
    exam.answers = exam.answers.filter((a) => a.index !== index);
    exam.answers.push({ questionId: qId, selected, correct, index });
    await exam.save();
  }
  /** 获取考试结果，包括正确率和每题情况 */
  async getExamResult(examId: string): Promise<{
    total: number;
    correctCount: number;
    accuracy: number;
    details: Array<{ index: number; questionId: string; correct: boolean }>;
  }> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试会话不存在');
    const total = exam.questionIds.length;
    const details: Array<{
      index: number;
      questionId: string;
      correct: boolean;
    }> = [];
    for (let i = 0; i < total; i++) {
      const ans = exam.answers.find((a) => a.index === i);
      details.push({
        index: i,
        questionId: exam.questionIds[i].toHexString(),
        correct: ans ? ans.correct : false,
      });
    }
    const correctCount = details.filter((d) => d.correct).length;
    const accuracy = total > 0 ? correctCount / total : 0;
    return { total, correctCount, accuracy, details };
  }
  /** 清空 exams 集合 */
  async clearAll(): Promise<any> {
    return this.examModel.deleteMany({}).exec();
  }
}
