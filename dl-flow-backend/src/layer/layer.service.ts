import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Layer } from './layer.schema';
import { Model, Types } from 'mongoose';
import { CreateLayerDto } from './dto/create-layer.dto';
import { DeleteLayer } from './dto/delete-layer.dto';

@Injectable()
export class LayerService {
  constructor(@InjectModel(Layer.name) private LayerModel: Model<Layer>) {}
  async findAll() {
    return await this.LayerModel.find({});
  }
  async saveLayer(dto: CreateLayerDto) {
    const data = {
      id: new Types.ObjectId(),
      ...dto,
      mode: 'layer',
    };
    return await this.LayerModel.create(data);
  }
  async deleteLayer(dto: DeleteLayer) {
    const { id } = dto;
    const layerExists = await this.isExists(id);
    if (!layerExists) {
      throw new HttpException('Layer not exists', HttpStatus.NOT_FOUND);
    }
    await this.LayerModel.deleteOne({ id });
  }
  private async isExists(id: string) {
    const data = await this.LayerModel.find({ id });
    return data.length >= 1;
  }
}
