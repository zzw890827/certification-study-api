import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, type: [String] })
  choices: string[];

  @Prop({ required: true })
  multiple: boolean;

  @Prop({ required: true, type: [String] })
  correctAnswer: string[];

  @Prop({ required: true, type: [String] })
  explanations: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
