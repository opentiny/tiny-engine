// backend/server/db/models/Material.js
const { EntitySchema } = require('typeorm');

const MaterialSchema = new EntitySchema({
  name: 'Material',
  tableName: 'materials',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    taskId: {
      type: 'varchar',
      length: 64,
      nullable: false,
      comment: '生成该物料的任务ID',
    },
    importType: {
      type: 'enum',
      enum: ['url', 'code', 'npm'],
      nullable: false,
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
      type: 'enum',
      enum: ['active', 'inactive'], 
      default: 'active',
      comment: '物料状态（软删除标记）',
    },
    createdAt: {
      type: 'datetime',
      createDate: true,
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true,
    },
  },
});

module.exports = MaterialSchema;