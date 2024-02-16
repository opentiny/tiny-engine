import { Cell, Layer } from './code-generate.schema';

export const layerCodeGen = (layer: Layer) => {
  const { code, id, clazz, properties } = layer;
  const args = properties.map(({ data }) => data);
  const call = [clazz, '(', args.join(','), ')'].join('');
  return [id, '=', call].join('');
};

export const nnCodeGen = (cell: Cell) => {
  const {
    data: { id, properties },
  } = cell;
  const args = properties.map(({ data }) => data);
  const stack = [id, '(', args, ')'];
  return stack.join('');
};
