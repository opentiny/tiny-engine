import { Controller, Get } from '@nestjs/common';
import { MaterialService } from './material.service';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}
  @Get()
  getAll() {
    return this.materialService.findAll();
  }
}
