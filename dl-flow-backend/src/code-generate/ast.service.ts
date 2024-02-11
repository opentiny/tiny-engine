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
    const fnCall: CallExpression = {
      callee: {
        val: `paddle.nn.${nn.id}`,
        codeGen: () => `paddle.nn.${nn.id}`,
      },
      args,
      codeGen: () => {
        return `${fnCall.callee.codeGen()}(${fnCall.args.join(',')})`;
      },
    };
    const varDecl: VarDecl = {
      name: cellId,
      val: fnCall,
      codeGen: () => {
        return `${varDecl.name} = ${varDecl.val.codeGen()}`;
      },
    };
    return varDecl;
  }
  buildLayer(layer: Layer, cellId: string) {
    const args = layer.properties.map((v) => v.data);
    const clazzDef: ClazzDefine = {
      name: layer.clazz,
      code: layer.code,
      codeGen: () => {
        return [layer.code, `${cellId}=${layer.clazz}(${args.join(',')})`].join(
          '\n',
        );
      },
    };
    return clazzDef;
  }
  isNN(data: Material | Layer): data is Material {
    return data.mode === 'nn';
  }
  isLayer(data: Material | Layer): data is Layer {
    return data.mode === 'layer';
  }
}

type VarDecl = {
  name: string;
  val: any;
  codeGen: () => string;
};
type Identifier = {
  val: string;
  codeGen: () => string;
};
type CallExpression = {
  callee: Identifier;
  args: any[];
  codeGen: () => string;
};
type ClazzDefine = {
  name: string;
  code: string;
  codeGen: () => string;
};

type ASTItem = VarDecl | Identifier | CallExpression | ClazzDefine;

type IAST = {
  type: 'root';
  children: ASTItem[];
  codeGen: () => string;
};
