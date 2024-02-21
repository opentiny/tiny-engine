import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Material } from './material.schema';
import { Model } from 'mongoose';
import { CretaeMaterial } from './dto/cretae-material.dto';
import { DeleteMaterial } from './dto/delete-material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly MaterialMode: Model<Material>,
  ) {}
  findAll() {
    return this.MaterialMode.find();
  }
  async createMaterial(data: CretaeMaterial) {
    const material = await this.MaterialMode.find({ id: data.id });
    if (material.length) {
      throw new HttpException(`${data.id} exists`, HttpStatus.CONFLICT);
    }
    return this.MaterialMode.create({ ...data });
  }
  async DeleteMaterial(data: DeleteMaterial) {
    const { id } = data;
    const material = await this.MaterialMode.find({ id });
    if (!material.length) {
      throw new HttpException(`Material ${id} not found`, HttpStatus.NOT_FOUND);
    }
    await this.MaterialMode.deleteOne({ id });
    return true;
  }
}
