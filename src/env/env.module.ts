import { Module } from '@nestjs/common';
import { EnvService } from './env.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ cache: true })],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
