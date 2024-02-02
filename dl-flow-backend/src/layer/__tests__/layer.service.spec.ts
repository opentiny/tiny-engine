import { Test, TestingModule } from '@nestjs/testing';
import { LayerService } from '../layer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Layer, LayerSchema } from '../Layer.schema';
import { DbModule } from '@app/database';

describe('LayerService', () => {
  let service: LayerService;
  let id = '';
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule,
        MongooseModule.forFeature([{ name: Layer.name, schema: LayerSchema }]),
      ],
      providers: [LayerService],
    }).compile();

    service = module.get<LayerService>(LayerService);
    id = (
      await service.saveLayer({
        label: {
          en_US: '',
          zh_CN: '',
        },
        properties: [],
        code: '',
        clazz: '',
      })
    ).id;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Get All Layer', () => {
    expect(service.findAll()).resolves.toHaveLength(1);
  });
  it('Create Layer', () => {
    expect(service.saveLayer({} as any)).resolves.not.toThrow();
  });
  it('Delete Layer', async () => {
    expect(service.deleteLayer({ id })).resolves.toBeUndefined();
  });
  it('Delete Layer But not exists', async () => {
    expect(service.deleteLayer({ id: 'not exists record' })).rejects.toThrow();
  });
});
