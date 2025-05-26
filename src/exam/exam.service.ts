import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './schemas/exam.schema';
import { Question, QuestionDocument } from '../core/schemas/question.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  private arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /** 创建考试会话，关联到 userId */
  async createExam(userId: string): Promise<{ examId: string; total: number }> {
    // 加权抽题：错误次数越多，抽中概率越大
    // 1. 读取所有题目的 _id 与 wrongCount
    const questions = await this.questionModel
      .find()
      .select('_id wrongCount')
      .lean<{ _id: Types.ObjectId; wrongCount?: number }[]>()
      .exec();
    if (!questions.length) throw new NotFoundException('题库中没有题目');
    // 2. 构建加权数组，每个题目根据 wrongCount+1 重复对应次数
    const pool: Types.ObjectId[] = [];
    for (const q of questions) {
      const weight = (q.wrongCount ?? 0) + 1;
      for (let i = 0; i < weight; i++) {
        pool.push(q._id);
      }
    }
    // 3. 随机从 pool 中抽取不重复的题目
    const selected = new Set<string>();
    const sampledIds: Types.ObjectId[] = [];
    while (sampledIds.length < 65 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const qid = pool[idx].toHexString();
      if (!selected.has(qid)) {
        selected.add(qid);
        sampledIds.push(new Types.ObjectId(qid));
      }
    }
    // 若不足65题，则补全随机无权重题
    if (sampledIds.length < 65) {
      const remaining = questions
        .map((q) => q._id)
        .filter((id) => !sampledIds.find((s) => s.equals(id)));
      while (sampledIds.length < 65 && remaining.length > 0) {
        const i = Math.floor(Math.random() * remaining.length);
        sampledIds.push(remaining.splice(i, 1)[0]);
      }
    }
    // 4. 创建考试会话
    const exam = await this.examModel.create({
      user: userId,
      questionIds: sampledIds,
      answers: [],
    });
    const examId = (exam._id as Types.ObjectId).toHexString();
    return { examId, total: sampledIds.length };
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
    let correct: boolean;

    switch (question.type) {
      case 'single':
        correct = selected[0] === (question.correctAnswer ?? [])[0];
        break;

      case 'multiple':
        correct =
          (question.correctAnswer ?? []).slice().sort().join(',') ===
          selected.slice().sort().join(',');
        break;

      case 'order':
        correct = this.arraysEqual(
          selected.map((s) => Number(s)),
          question.correctOrder ?? [],
        );
    }

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
