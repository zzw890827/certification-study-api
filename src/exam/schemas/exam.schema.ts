import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamDocument = Exam & Document;

@Schema({ timestamps: true })
export class Exam {
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
  })
  answers: Array<{
    questionId: Types.ObjectId;
    selected: string[];
    correct: boolean;
    index: number;
  }>;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
