import { Body, Controller, Get, Post } from '@nestjs/common';
import { PendingToAproveService } from './pending-to-aprove.service';
import { CreatePendingToAproveDTO } from './dto/createPendingToAproveDto';
import { ApproveDTO } from './dto/approveDto';
import { EnvService } from '../env/env.service';

@Controller('pending-to-aprove')
export class PendingToAproveController {
  constructor(
    private readonly pendingToAproveService: PendingToAproveService,
    private readonly envService: EnvService,
  ) {}

  @Post('/upload')
  public async create(@Body() body: CreatePendingToAproveDTO) {
    return this.pendingToAproveService.create(body);
  }

  @Post('/approve')
  public async approve(@Body() body: ApproveDTO) {
    return this.pendingToAproveService.approveById(body);
  }

  @Get('/approve-all')
  public async approveAll() {
    if (this.envService.NODE_ENV === 'development') {
      return this.pendingToAproveService.approveAll();
    }
    return {
      msg: 'Anda paya bobo',
    };
  }
}
