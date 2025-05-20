import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  text: string;

  // 题目类型: single=单选, multiple=多选, order=排序题
  @Prop({ required: true, enum: ['single', 'multiple', 'order'] })
  type: 'single' | 'multiple' | 'order';

  // 题目选项
  @Prop({ required: true, type: [String] })
  options: string[];

  // 正确答案 (针对 single/multiple)
  @Prop({ type: [String] })
  correctAnswer?: string[];

  // 正确顺序 (针对 order 排序题，存储 options 索引列表)
  @Prop({ type: [Number] })
  correctOrder?: number[];

  // 选项解释或步骤说明
  @Prop({ type: [String] })
  explanations?: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
