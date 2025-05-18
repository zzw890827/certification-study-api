import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  selected: string[];
}
