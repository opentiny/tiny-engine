import { Controller, Get, Post, Body } from '@nestjs/common';
import { LayerService } from './layer.service';
import { CreateLayerDto } from './dto/create-layer.dto';

@Controller('layer')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}
  @Get('/')
  async getLayerList() {
    return await this.layerService.findAll();
  }
  @Post('/')
  createLayer(@Body() dto: CreateLayerDto) {
    return this.layerService.saveLayer(dto);
  }
}
