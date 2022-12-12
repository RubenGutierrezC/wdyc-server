import { IsArray, IsNotEmpty } from 'class-validator';

export class ApproveDTO {
  @IsNotEmpty()
  @IsArray()
  urls: string[];
}
