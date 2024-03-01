import { Injectable } from '@nestjs/common';
import { Material } from '../material/material.schema';
import { Layer } from '../layer/layer.schema';
import { Cell } from './code-generate.schema';
import { StandardizationNodes } from './code-generate.service';

@Injectable()
export class AST {
  build(cells: Cell[], standardizationNodes: StandardizationNodes) {
    const ast: IAST = {
      type: 'root',
      children: [
        // I HATE PYTHON
        new VarDecl('true', new Identifier('True')),
        new VarDecl('false', new Identifier('False')),
      ],
      codeGen: () => {
        return ast.children.map((child) => child.codeGen()).join('\n');
      },
    };
    for (const cell of cells) {
      const data = cell.data as Material | Layer;
      let item;
      if (this.isGroup(cell)) {
        item = this.buildGroup(cell, standardizationNodes);
        ast.children.push(item);
        continue;
      }
      if (this.isLayer(data)) {
        item = this.buildLayer(data);
        ast.children.push(item);
        const callee = new Identifier(data.clazz);
        const clazzInstance = new CallExpression(
          callee,
          data.properties.map((v) => `${v.id}=${v.data}`),
        );
        const instance = new VarDecl(cell.id.replace('-', ''), clazzInstance);
        ast.children.push(instance);
        continue;
      }
      if (this.isNN(data)) {
        item = this.buildNN(data, cell.id);
        ast.children.push(item);
        continue;
      }
    }
    ast.children.push(new VarDecl('model', this.buildSequential(ast)));
    return ast;
  }
  /**
   * Eg.
   *  abcd -> 'abcd'
   */
  standardization(val: unknown, type?: string): string {
    if (val === 'true' || val === 'false') {
      return val;
    }
    if (type === 'list') {
      return `[${(val as any[]).map((v) =>
        typeof v !== 'string' ? JSON.stringify(v) : `'${v}'`,
      )}]`;
    }
    if (type === 'boolean') {
      return `${Boolean(val)}`;
    }
    if (type === 'string') {
      return `'${val}'`;
    }
    return `${val}`;
  }
  standardizationParamAttr(key: string, val: string) {
    switch (key) {
      case 'name':
        return this.standardization(val, 'string');
      case 'learning_rate':
        return this.standardization(val, 'number');
      case 'trainable':
        return this.standardization(val, 'boolean');
      case 'do_model_average':
        return this.standardization(val, 'boolean');
      case 'need_clip':
        return this.standardization(val, 'boolean');
      default:
        return val;
    }
  }
  buildNN(nn: Material, cellId: string) {
    const args = nn.properties
      .map((v) => {
        const id = v.id;
        if (typeof v.data === 'object' && !Array.isArray(v.data)) {
          const args: string[] = [];
          for (const key of Object.keys(v.data)) {
            if (v.data[key] !== undefined) {
              const val =
                v.type === 'ParamAttr'
                  ? this.standardizationParamAttr(key, v.data[key])
                  : this.standardization(
                      v.data[key] ?? v.default ?? 'None',
                      v.type,
                    );
              args.push(new VarDecl(key, new Identifier(val)).codeGen());
            }
          }
          const callExpression = new CallExpression(
            new Identifier(v.type),
            args,
          );
          const varDecl = new VarDecl(id, callExpression);
          return varDecl.codeGen();
        }
        if (v.data) {
          return new VarDecl(
            id,
            new Identifier(this.standardization(v.data, v.type)),
          ).codeGen();
        }
      })
      .filter((v) => v !== undefined);
    const callee = new Identifier(`paddle.nn.${nn.id}`);
    const fnCall = new CallExpression(callee, args);
    const varDecl = new VarDecl(`node${cellId.replace(/-/gim, '')}`, fnCall);
    return varDecl;
  }
  extractGroup(group: Cell, nodeTable: StandardizationNodes) {
    const stack: Cell[] = [];
    if (this.isGroup(group)) {
      stack.push(group);
    }
    for (const child of (group.children as unknown as string[]) ?? []) {
      if (this.isGroup(nodeTable[child])) {
        stack.push(...this.extractGroup(nodeTable[child], nodeTable));
      }
    }
    return stack;
  }
  isChild(group: Cell, child: Cell) {
    return (group.children as unknown as string[]).includes(child.id);
  }
  buildLayer(layer: Layer) {
    const clazzDef = new ClazzDef(layer.code);
    return clazzDef;
  }
  buildGroup(group: Cell, standardizationNodes: StandardizationNodes) {
    const ast = new GroupAst();
    const stack: [Cell, 'start' | 'node' | 'end'][] = [];
    const groups = this.extractGroup(group, standardizationNodes);
    for (const g of groups) {
      stack.push([g, 'start']);
      for (const child of (g.children as unknown as string[]) ?? []) {
        stack.push([standardizationNodes[child], 'node']);
      }
      stack.push([g, 'end']);
    }
    let activeGroup: Cell | null = null;
    while (stack.length) {
      const [cell, type] = stack.pop();
      const children = [];
      if (type === 'end') {
        activeGroup = cell;
      }
      if (type === 'node') {
        if (this.isGroup(cell)) {
          children.push(`group_${cell.id.replace(/-/gim, '')}`);
        } else {
          if (this.isNN(cell.data)) {
            children.push(`node${cell.id.replace(/-/gim, '')}`);
          }
          if (this.isLayer(cell.data)) {
            children.push(`${cell.id.replace('-', '')}`);
          }
        }
        while (true) {
          const [cell, type] = stack.pop();
          if (type === 'start') {
            break;
          }
          if (this.isGroup(cell)) {
            children.push(`group_${cell.id.replace(/-/gim, '')}`);
          } else {
            if (this.isNN(cell.data)) {
              children.push(`node${cell.id.replace(/-/gim, '')}`);
            }
            if (this.isLayer(cell.data)) {
              children.push(`${cell.id.replace('-', '')}`);
            }
          }
        }
        if (!activeGroup) {
          throw new Error(
            `Can not find active group. Please check your schema.`,
          );
        }
        const callee = new Identifier('paddle.concat');
        const call = new CallExpression(callee, [
          ['x=[', children.join(','), ']'].join(''),
        ]);
        const concatVar = new VarDecl(
          `group_${activeGroup.id}`.replace(/-/gim, ''),
          call,
        );
        ast.children.push(concatVar);
        ast.childId.push(...children);
      }
    }
    return ast;
  }
  buildSequential(ast: IAST) {
    const stack = [
      ...ast.children
        .map((child) => {
          if (child instanceof VarDecl) {
            return child.name;
          }
          if (child instanceof GroupAst) {
            return child.children.map((child) =>
              child instanceof VarDecl ? child.name : null,
            );
          }
          return null;
        })
        .flat()
        .filter(
          (child) => child !== null && child !== 'true' && child !== 'false',
        ),
    ];
    const groups = ast.children
      .map((child) => (child instanceof GroupAst ? child : null))
      .filter((child) => child !== null);
    const childrenId = groups
      .map((group) => group.childId)
      .reduce((pre, cur) => [...pre, ...cur], []);
    return new CallExpression(
      new Identifier('paddle.nn.Sequential'),
      stack.filter((item) => !childrenId.includes(item)),
    );
  }

  isGroup(cell: Cell) {
    return cell?.shape && cell.shape.includes('group');
  }
  isNN(data: Material | Layer): data is Material {
    return data.mode === 'nn';
  }
  isLayer(data: Material | Layer): data is Layer {
    return data.mode === 'layer';
  }
}

// base type
export class Node {}

export class VarDecl implements IVarDecl, Node {
  public name: string;
  public val: ASTItem;
  constructor(name: string, val: ASTItem) {
    this.name = name;
    this.val = val;
  }
  codeGen() {
    return `${this.name} = ${this.val.codeGen()}`.replace('\t', '');
  }
}

export class Identifier implements IIdentifier, Node {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  codeGen() {
    return `${this.name}`;
  }
}

export class CallExpression implements ICallExpression, Node {
  callee: IIdentifier;
  args: any[];
  constructor(callee: IIdentifier, args: any[]) {
    this.callee = callee;
    this.args = args;
  }
  codeGen() {
    return `${this.callee.codeGen()}(${this.args.join(',')})`;
  }
}

export class ClazzDef implements IClazzDefine {
  code: string;
  constructor(code: string) {
    this.code = code;
  }
  codeGen() {
    return `${this.code}`;
  }
}

export class Statement implements IStmt, Node {
  children: Node[] = [];
}

export class GroupAst implements IGroupAst {
  type = 'root' as const;
  children: ASTItem[] = [];
  childId: string[] = [];
  codeGen() {
    return this.children.map((child) => child.codeGen()).join('\n');
  }
}

type IVarDecl = {
  name: string;
  val: ASTItem;
  codeGen: () => string;
};
type IIdentifier = {
  name: string;
  codeGen: () => string;
};
type ICallExpression = {
  callee: IIdentifier;
  args: any[];
  codeGen: () => string;
};
type IClazzDefine = {
  code: string;
  codeGen: () => string;
};
type IStmt = {
  children: Node[];
};

type ASTItem =
  | IVarDecl
  | IIdentifier
  | ICallExpression
  | IClazzDefine
  | IGroupAst;

type IAST = {
  type: 'root';
  children: ASTItem[];
  codeGen: () => string;
};

interface IGroupAst extends IAST {
  childId: string[];
}
