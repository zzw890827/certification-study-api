import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';

@Module({
  imports: [CoreModule],
  providers: [PracticeService],
  controllers: [PracticeController],
  exports: [PracticeService],
})
export class PracticeModule {}
