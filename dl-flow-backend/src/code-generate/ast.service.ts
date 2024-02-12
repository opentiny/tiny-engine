import { Injectable } from '@nestjs/common';
import { Material } from '../material/material.schema';
import { Layer } from '../layer/layer.schema';
import { Cell } from './code-generate.schema';

@Injectable()
export class AST {
  build(cells: Cell[]) {
    const ast: IAST = {
      type: 'root',
      children: [],
      codeGen: () => ast.children.map((child) => child.codeGen()).join('\n'),
    };
    for (const cell of cells) {
      const data = cell.data as Material | Layer;
      let item;
      if (this.isLayer(data)) {
        item = this.buildLayer(data, cell.id);
      }
      if (this.isNN(data)) {
        item = this.buildNN(data, cell.id);
      }
      ast.children.push(item);
    }
    return ast;
  }
  buildNN(nn: Material, cellId: string) {
    const args = nn.properties.map((v) => v.data);
    const callee = new Identifier(nn.id);
    const fnCall = new CallExpression(callee, args);

    const varDecl = new VarDecl(cellId.replace('-', ''), fnCall);
    return varDecl;
  }
  buildLayer(layer: Layer, cellId: string) {
    const args = layer.properties.map((v) => v.data);
    const clazzDef: IClazzDefine = {
      name: layer.clazz,
      code: layer.code,
      codeGen: () => {
        return [
          layer.code,
          `${cellId.replace('-', '')}=${layer.clazz}(${args.join(',')})`,
        ].join('\n');
      },
    };
    return clazzDef;
  }
  buildGroup(cells: Cell) {
    const subAst: IAST = {
      type: 'root',
      children: [],
      codeGen: () => subAst.children.map((child) => child.codeGen()).join('\n'),
    };
    for (const child of cells.children ?? []) {
      if (this.isGroup(child)) {
        subAst.children.push(...this.buildGroup(child).children);
      }
      if (this.isNN(child.data)) {
        subAst.children.push(this.buildNN(child.data, child.id));
      }
      if (this.isLayer(child.data)) {
        subAst.children.push(this.buildLayer(child.data, child.id));
      }
    }
    const idx = subAst.children.findIndex((item) => item instanceof Node);
    if (idx === -1) {
      throw new Error('Should find one var decl, but can not find anything');
    }
    return subAst;
  }
  isGroup(cell: Cell) {
    return cell.shape.includes('group');
  }
  isNN(data: Material | Layer): data is Material {
    return data.mode === 'nn';
  }
  isLayer(data: Material | Layer): data is Layer {
    return data.mode === 'layer';
  }
}

// base type
class Node {}

class VarDecl implements IVarDecl, Node {
  name: string;
  val: ASTItem;
  constructor(name: string, val: ASTItem) {
    this.name = name;
    this.val = val;
  }
  codeGen() {
    return `${this.name} = ${this.val.codeGen()}`.replace('\t', '');
  }
}

class Identifier implements IIdentifier, Node {
  prefix = 'paddle.nn';
  name: string;
  constructor(name: string, prefix = 'paddle.nn') {
    this.name = name;
    this.prefix = prefix;
  }
  codeGen() {
    return `${this.prefix}.${this.name}`;
  }
}

class CallExpression implements ICallExpression, Node {
  callee: IIdentifier;
  args: any[];
  constructor(calle: IIdentifier, args: any[]) {
    this.callee = calle;
    this.args = args;
  }
  codeGen() {
    return `${this.callee.codeGen()}(${this.args.join(',')})`;
  }
}

type IVarDecl = {
  name: string;
  val: ASTItem;
  codeGen: () => string;
};
type IIdentifier = {
  prefix: string;
  name: string;
  codeGen: () => string;
};
type ICallExpression = {
  callee: IIdentifier;
  args: any[];
  codeGen: () => string;
};
type IClazzDefine = {
  name: string;
  code: string;
  codeGen: () => string;
};

type ASTItem = IVarDecl | IIdentifier | ICallExpression | IClazzDefine;

type IAST = {
  type: 'root';
  children: ASTItem[];
  codeGen: () => string;
};
