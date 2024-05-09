import { Test, TestingModule } from '@nestjs/testing';
import { MaterialService } from '../material.service';
import { Material, MaterialSchema } from '../material.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DbModule } from '@app/database';
import { RedisModule } from '@app/redis';

describe('MaterialService', () => {
  let service: MaterialService;
  let id = '';
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule,
        MongooseModule.forFeature([
          {
            name: Material.name,
            schema: MaterialSchema,
          },
        ]),
        RedisModule,
      ],
      providers: [MaterialService],
    }).compile();

    service = module.get<MaterialService>(MaterialService);
    id = (
      await service.createMaterial({
        id: 'TestLayer',
        label: {
          en_US: 'Test',
          zh_CN: '测试',
        },
        desc: '',
        properties: [],
        nn: true,
        mode: 'nn',
      })
    ).id;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('getAll', () => {
    expect(service.findAll()).resolves.toHaveLength(1);
  });
  it('delete', () => {
    expect(service.DeleteMaterial({ id })).resolves.toBe(true);
  });
  it('delete but not exiets', () => {
    expect(service.DeleteMaterial({ id: 'not exists' })).rejects.toThrow();
  });
  it('create but exists', () => {
    expect(
      service.createMaterial({
        id,
        label: {
          en_US: 'Test',
          zh_CN: '测试',
        },
        desc: '',
        properties: [],
        nn: true,
        mode: 'nn',
      }),
    ).rejects.toThrow();
  });
});
