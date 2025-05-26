import { IsString, MinLength } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  readonly username: string;

  @IsString()
  @MinLength(6)
  readonly code: string;
}
