import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { DbModule } from '@app/database';
import { MongooseModule } from '@nestjs/mongoose';
import { Material, MaterialSchema } from './material.schema';

@Module({
  imports: [
    DbModule,
    MongooseModule.forFeature([
      {
        name: Material.name,
        schema: MaterialSchema,
      },
    ]),
  ],
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
