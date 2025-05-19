import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamDocument = Exam & Document;

@Schema({ timestamps: true })
export class Exam {
  // 关联到具体用户，存储 Cognito sub（字符串）
  @Prop({ required: true })
  user: string;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'Question' })
  questionIds: Types.ObjectId[];

  @Prop({
    required: true,
    type: [
      {
        questionId: Types.ObjectId,
        selected: [String],
        correct: Boolean,
        index: Number,
      },
    ],
    default: [],
  })
  answers: Array<{
    questionId: Types.ObjectId;
    selected: string[];
    correct: boolean;
    index: number;
  }>;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
