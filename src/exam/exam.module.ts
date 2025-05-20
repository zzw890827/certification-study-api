import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from '../core/core.module';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';

@Module({
  imports: [
    CoreModule,
    MongooseModule.forFeature([{ name: Exam.name, schema: ExamSchema }]),
  ],
  providers: [ExamService],
  controllers: [ExamController],
})
export class ExamModule {}
