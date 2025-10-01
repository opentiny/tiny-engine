// backend/server/db/models/Material.js
const { EntitySchema } = require('typeorm');

// 必须通过 EntitySchema 显式定义元数据
const MaterialSchema = new EntitySchema({
  name: 'Material', // 模型名称（必须与后续 getRepository 传入的名称一致）
  tableName: 'materials', // 数据库表名
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true, // 自动递增主键
    },
    taskId: {
      type: 'varchar',
      length: 64,
      nullable: false,
      comment: '生成该物料的任务ID',
    },
    importType: {
      type: 'varchar',
      length: 10,
      nullable: false,
      enum: ['url', 'code', 'npm'], // 枚举限制
      comment: '导入类型',
    },
    source: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: '来源标识（URL/NPM包名/文件名）',
    },
    componentName: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: '组件名称',
    },
    content: {
      type: 'json',
      nullable: false,
      comment: '物料结构化数据',
    },
    status: {
      type: 'varchar',
      length: 10,
      default: 'active',
      enum: ['active', 'inactive'],
      comment: '物料状态（软删除标记）',
    },
    createdAt: {
      type: 'datetime',
      createDate: true, // 自动生成创建时间
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true, // 自动生成更新时间
    },
  },
});

// 必须导出 EntitySchema 实例（而非普通对象）
module.exports = MaterialSchema;