import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { UploadService } from './upload.service';

@Module({
  imports: [EnvModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
