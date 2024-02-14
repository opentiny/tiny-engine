import { Injectable } from '@nestjs/common';
import { Material } from '../material/material.schema';
import { Layer } from '../layer/layer.schema';
import { Cell } from './code-generate.schema';

@Injectable()
export class AST {
  build(cells: Cell[]) {
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
        item = this.buildGroup(cell);
      }
      if (this.isLayer(data)) {
        item = this.buildLayer(data);
        ast.children.push(item);
        const callee = new Identifier(data.clazz);
        const clazzInstance = new CallExpression(
          callee,
          data.properties.map((v) => v.data),
        );
        const instance = new VarDecl(cell.id.replace('-', ''), clazzInstance);
        ast.children.push(instance);
      }
      if (this.isNN(data)) {
        item = this.buildNN(data, cell.id);
      }
      ast.children.push(item);
    }
    return ast;
  }
  /**
   * Eg.
   *  abcd -> 'abcd'
   */
  standardization(val: string): string {
    if (val.toString() === 'true' || val.toString() === 'false') {
      return val;
    }
    if (/[a-zA-Z]/.test(val)) {
      return `'${val}'`;
    }
    return `${val}`;
  }
  buildNN(nn: Material, cellId: string) {
    const args = nn.properties
      .map((v) => {
        if (typeof v.data === 'object') {
          const args: string[] = [];
          for (const key of Object.keys(v.data)) {
            if (v.data[key]) {
              const val = this.standardization(
                v.data[key] ?? v.default ?? 'None',
              );
              args.push(new VarDecl(key, new Identifier(val)).codeGen());
            }
          }
          const callExpression = new CallExpression(
            new Identifier(v.type),
            args,
          );
          const varDecl = new VarDecl(v.id, callExpression);
          return varDecl.codeGen();
        }
        if (v.data) {
          return new VarDecl(
            v.id,
            new Identifier(this.standardization(v.data)),
          ).codeGen();
        }
      })
      .filter((v) => v !== undefined);
    const callee = new Identifier(`paddle.nn.${nn.id}`);
    const fnCall = new CallExpression(callee, args);
    const varDecl = new VarDecl(cellId.replace(/-/gim, ''), fnCall);
    return varDecl;
  }
  buildLayer(layer: Layer) {
    const clazzDef = new ClazzDef(layer.code);
    return clazzDef;
  }
  buildGroup(group: Cell) {
    const subAst: IAST = {
      type: 'root',
      children: [],
      codeGen: () => subAst.children.map((child) => child.codeGen()).join('\n'),
    };
    const groups: { [x: string]: string[] } = {};
    for (const child of group.children ?? []) {
      if (this.isGroup(child)) {
        if (!groups[child.id]) {
          groups[child.id] = [];
        }
        const subAST = this.buildGroup(child);
        subAst.children.push(...subAST.children);
        groups[child.id] = subAST.children
          .filter(
            (v, i) => i !== subAST.children.length - 1 && v instanceof VarDecl,
          )
          .map((v: VarDecl) => v.name);
      }
      if (this.isNN(child.data)) {
        const nn = this.buildNN(child.data, child.id);
        subAst.children.push(nn);
        if (groups[child.id]) {
          groups[child.id].push(nn.name);
        }
      }
      if (this.isLayer(child.data)) {
        const clazz = this.buildLayer(child.data);
        const callee = new Identifier(child.data.clazz);
        const clazzInstance = new CallExpression(
          callee,
          child.data.properties.map((v) => v.data),
        );
        const instance = new VarDecl(child.id, clazzInstance);
        subAst.children.push(clazz);
        subAst.children.push(instance);
      }
    }
    groups[group.id] = group.children
      .filter((child) => !this.isGroup(child))
      .map((v) => v.id);
    const varDecl = subAst.children.filter(
      (item) => item instanceof VarDecl,
    ) as VarDecl[];
    const keys = Object.keys(groups);
    const values = keys
      .map((k) => Object.values(groups[k]))
      .reduce((pre, cur) => {
        return [...pre, ...cur];
      }, []);
    const names =
      keys.length === 1
        ? varDecl.map((decl) => decl.name)
        : varDecl
            .map((decl) => {
              return decl.name;
            })
            .filter((v) => {
              return !keys.includes(v) && !values.includes(v);
            });

    const callee = new Identifier('paddle.concat');
    const call = new CallExpression(callee, [
      ['x=[', names.join(','), ']'].join(''),
    ]);
    const concatVar = new VarDecl(group.id.replace('-', ''), call);
    subAst.children.push(concatVar);
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

class Identifier implements IIdentifier, Node {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  codeGen() {
    return `${this.name}`;
  }
}

class CallExpression implements ICallExpression, Node {
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

class ClazzDef implements IClazzDefine {
  code: string;
  constructor(code: string) {
    this.code = code;
  }
  codeGen() {
    return `${this.code}`;
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

type ASTItem = IVarDecl | IIdentifier | ICallExpression | IClazzDefine;

type IAST = {
  type: 'root';
  children: ASTItem[];
  codeGen: () => string;
};
