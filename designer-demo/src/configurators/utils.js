import { useCanvas } from "@opentiny/tiny-engine";

const { getCurrentSchema, getPageSchema, operateNode, getNodeWithParentById } =
  useCanvas();

export const sortFormModel = (target, reference) => {
  const targetOrder = new Map();
  reference.forEach((item, index) => {
    targetOrder.set(item.beta, index);
  });
  const sortableItems = target.filter((item) => item.condition !== false);
  const nonSortableItems = target.filter((item) => item.condition === false);
  sortableItems.sort((a, b) => {
    const indexA = targetOrder.get(a.label);
    const indexB = targetOrder.get(b.label);
    return indexA - indexB;
  });
  return sortableItems.concat(nonSortableItems);
};

const setStateProps = (target, modelDetail) => {
  const value = modelDetail.value;
  const unused = modelDetail.unused;
  value.forEach((item) => {
    // 如果没有该属性，则初始化为null
    if (!target?.[item.prop]) {
      target[item.prop] = null;
    }
  });
  unused.forEach((item) => {
    // 如果有该属性且值不为null，则删除该字段
    if (item.prop in target) {
      delete target[item.prop];
    }
  });
};

export const setFormModelCondition = () => {
  const currentSchema = getCurrentSchema();
  const parentNode = getNodeWithParentById(currentSchema.id).parent;
  if (parentNode?.componentType === "ModelPage") {
    const pageSchema = getPageSchema();
    const serviceModel = currentSchema.props.serviceModel;
    // 给搜索表单和弹窗表单添加condition: false
    const setConditions = (target) => {
      target.forEach((item) => {
        if (
          serviceModel.unused.find(
            (tableModelItem) =>
              tableModelItem.prop === item.children[0].props.prop
          )
        ) {
          item.condition = false;
        } else {
          item.condition = true;
        }
      });
    };
    setConditions(parentNode.children[0].children); // tinyForm->tinycol
    setConditions(parentNode.children[2].children[0].children[0].children); // dialogbox->div(slot)->tinyForm->tinycol
    setStateProps(
      pageSchema.state[`modelState_${parentNode.id}`].search,
      serviceModel
    );
    setStateProps(
      pageSchema.state[`modelState_${parentNode.id}`].detail,
      serviceModel
    );
    operateNode({
      type: "updateAttributes",
      id: parentNode.id,
      value: { children: parentNode.children },
    });
    useCanvas().canvasApi.value.updateRect();
  }
};


export const transformNode = (node) => {
  const result = {
    prop: node.name,
    type: node.type,
    required: node.isRequired,
    description: node.description === null ? '--' : node.description,
    parameterIn: node.parameterIn,
  };

  if (node.children && node.children.length > 0 && node.type !== 'array') {
    result.children = node.children.map((child) => transformNode(child));
  }

  return result;
};
