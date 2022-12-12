import { Body, Controller, Post } from '@nestjs/common';
import { PendingToAproveService } from './pending-to-aprove.service';
import { CreatePendingToAproveDTO } from './dto/createPendingToAproveDto';
import { ApproveDTO } from './dto/approveDto';

@Controller('pending-to-aprove')
export class PendingToAproveController {
  constructor(
    private readonly pendingToAproveService: PendingToAproveService,
  ) {}

  @Post('/upload')
  public async create(@Body() body: CreatePendingToAproveDTO) {
    return this.pendingToAproveService.create(body);
  }

  @Post('/approve')
  public async approve(@Body() body: ApproveDTO) {
    return this.pendingToAproveService.approveById(body);
  }
}
