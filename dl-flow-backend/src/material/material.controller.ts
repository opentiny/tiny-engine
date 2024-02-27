import { Controller, Get, UseGuards } from '@nestjs/common';
import { MaterialService } from './material.service';
import { AuthGuard } from '../auth-guard/auth-guard.guard';

@UseGuards(AuthGuard)
@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}
  @Get()
  getAll() {
    return this.materialService.findAll();
  }
}
