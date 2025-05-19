import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './schemas/exam.schema';
import { QuestionDocument } from '../question/schemas/question.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel('Question') private questionModel: Model<QuestionDocument>,
  ) {}

  /** 创建考试会话，关联到 userId */
  async createExam(userId: string): Promise<{ examId: string; total: number }> {
    const samples = await this.questionModel.aggregate<{ _id: Types.ObjectId }>(
      [{ $sample: { size: 65 } }, { $project: { _id: 1 } }],
    );
    const questionIds = samples.map((s) => s._id);
    const exam = await this.examModel.create({
      user: userId,
      questionIds,
      answers: [],
    });
    const examId = (exam._id as Types.ObjectId).toHexString();
    return { examId, total: questionIds.length };
  }

  /** 获取考试中的单题，检查 userId 拥有权 */
  async getExamQuestion(
    userId: string,
    examId: string,
    index: number,
  ): Promise<any> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试不存在');
    if (exam.user !== userId)
      throw new UnauthorizedException('无权限访问此考试');
    if (index < 0 || index >= exam.questionIds.length)
      throw new NotFoundException(`题目索引 ${index} 不存在`);
    const qId = exam.questionIds[index];
    const question = await this.questionModel
      .findById(qId)
      .select('-correctAnswer')
      .lean()
      .exec();
    if (!question) throw new NotFoundException('题目不存在');
    return question;
  }

  /** 提交答案，记录错误，检查 userId 拥有权 */
  async submitAnswer(
    userId: string,
    examId: string,
    index: number,
    selected: string[],
  ): Promise<void> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试不存在');
    if (exam.user !== userId)
      throw new UnauthorizedException('无权限提交此考试');
    if (index < 0 || index >= exam.questionIds.length)
      throw new NotFoundException(`题目索引 ${index} 不存在`);
    const qId = exam.questionIds[index];
    const question = await this.questionModel.findById(qId).exec();
    if (!question) throw new NotFoundException('题目不存在');
    const correct = question.multiple
      ? selected.slice().sort().join(',') ===
        question.correctAnswer.slice().sort().join(',')
      : selected[0] === question.correctAnswer[0];
    // 更新错题计数
    if (!correct) {
      await this.questionModel
        .updateOne({ _id: qId }, { $inc: { wrongCount: 1 } })
        .exec();
    }
    exam.answers = exam.answers.filter((a) => a.index !== index);
    exam.answers.push({ questionId: qId, selected, correct, index });
    await exam.save();
  }

  /** 获取考试结果，检查 userId 拥有权 */
  async getExamResult(userId: string, examId: string): Promise<any> {
    const exam = await this.examModel.findById(examId).exec();
    if (!exam) throw new NotFoundException('考试不存在');
    if (exam.user !== userId)
      throw new UnauthorizedException('无权限查看此考试');
    const total = exam.questionIds.length;
    const details = exam.answers
      .map((a) => ({
        index: a.index,
        questionId: a.questionId.toHexString(),
        correct: a.correct,
      }))
      .sort((a, b) => a.index - b.index);
    const correctCount = details.filter((d) => d.correct).length;
    return {
      total,
      correctCount,
      accuracy: total ? correctCount / total : 0,
      details,
    };
  }
  /** 清空指定用户的所有考试数据（仅用于测试或重置） */
  async clearAll(userId: string): Promise<void> {
    await this.examModel.deleteMany({ user: userId }).exec();
  }
}
