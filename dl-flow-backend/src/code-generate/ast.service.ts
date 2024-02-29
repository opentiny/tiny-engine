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
    console.log(group);
    const ast: GroupAst = {
      type: 'root',
      children: [],
      childId: [],
      codeGen: () => ast.children.map((child) => child.codeGen()).join('\n'),
    };
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
          children.push(`node${cell.id.replace(/-/gim, '')}`);
        }
        while (true) {
          const [cell, type] = stack.pop();
          if (type === 'start') {
            break;
          }
          if (this.isGroup(cell)) {
            children.push(`group_${cell.id.replace(/-/gim, '')}`);
          } else {
            children.push(`node${cell.id.replace(/-/gim, '')}`);
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
      }
    }
    return ast;
  }
  // buildGroup(group: Cell, standardizationNodes: StandardizationNodes) {
  //   const subAst: IAST = {
  //     type: 'root',
  //     children: [],
  //     codeGen: () => subAst.children.map((child) => child.codeGen()).join('\n'),
  //   };
  //   const groups: { [x: string]: string[] } = {};
  //   for (const childId of (group.children as unknown as string[]) ?? []) {
  //     const child = standardizationNodes[childId];
  //     if (this.isGroup(child)) {
  //       if (!groups[child.id]) {
  //         groups[child.id] = [];
  //       }
  //       const subAST = this.buildGroup(child, standardizationNodes);
  //       subAst.children.push(...subAST.children);
  //       groups[child.id] = subAST.children
  //         .filter(
  //           (v, i) => i !== subAST.children.length - 1 && v instanceof VarDecl,
  //         )
  //         .map((v: VarDecl) => v.name);
  //     }
  //     if (this.isNN(child.data)) {
  //       const nn = this.buildNN(child.data, child.id);
  //       subAst.children.push(nn);
  //       if (groups[child.id]) {
  //         groups[child.id].push(nn.name);
  //       }
  //     }
  //     if (this.isLayer(child.data)) {
  //       const clazz = this.buildLayer(child.data);
  //       const callee = new Identifier(child.data.clazz);
  //       const clazzInstance = new CallExpression(
  //         callee,
  //         child.data.properties.map((v) => `${v.id} = ${v.data}`),
  //       );
  //       const instance = new VarDecl(child.id, clazzInstance);
  //       subAst.children.push(clazz);
  //       subAst.children.push(instance);
  //     }
  //   }
  //   groups[group.id] = group.children
  //     .filter((child) => !this.isGroup(child))
  //     .map((v) => v.id);
  //   const varDecl = subAst.children.filter(
  //     (item) => item instanceof VarDecl,
  //   ) as VarDecl[];
  //   const keys = Object.keys(groups);
  //   const values = keys
  //     .map((k) => Object.values(groups[k]))
  //     .reduce((pre, cur) => {
  //       return [...pre, ...cur];
  //     }, []);
  //   const names =
  //     keys.length === 1
  //       ? varDecl.map((decl) => decl.name)
  //       : varDecl
  //           .map((decl) => {
  //             return decl.name;
  //           })
  //           .filter((v) => {
  //             return !keys.includes(v) && !values.includes(v);
  //           });

  //   const callee = new Identifier('paddle.concat');
  //   const call = new CallExpression(callee, [
  //     ['x=[', names.join(','), ']'].join(''),
  //   ]);
  //   const concatVar = new VarDecl(
  //     `group_${group.id}`.replace(/-/gim, ''),
  //     call,
  //   );
  //   subAst.children.push(concatVar);
  //   return subAst;
  // }
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
  | GroupAst;

type IAST = {
  type: 'root';
  children: ASTItem[];
  codeGen: () => string;
};

interface GroupAst extends IAST {
  childId: string[];
}
