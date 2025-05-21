import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, enum: ['single', 'multiple', 'order'] })
  type: 'single' | 'multiple' | 'order';

  @Prop({ required: true, type: [String] })
  options: string[];

  @Prop({ type: [String] })
  correctAnswer?: string[];

  @Prop({ type: [Number] })
  correctOrder?: number[];

  @Prop({ type: [String] })
  questions?: string[];

  @Prop({ type: [String] })
  explanations?: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
