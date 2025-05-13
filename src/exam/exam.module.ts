import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
    QuestionModule,
  ],
  providers: [ExamService],
  controllers: [ExamController],
})
export class ExamModule {}
