import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum type {
  IMAGE = 'IMAGE',
  PHRASE_TO_COMPLETE = 'PHRASE_TO_COMPLETE',
  PHRASE_TO_ANSWER = 'PHRASE_TO_ANSWER',
}

export class CreatePendingToAproveDTO {
  @IsString()
  @IsNotEmpty()
  @IsEnum(type)
  type: type;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  uploadMode: string;

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}
