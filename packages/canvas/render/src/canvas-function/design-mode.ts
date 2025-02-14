export const DESIGN_MODE = {
  DESIGN: 'design', // 设计态
  RUNTIME: 'runtime' // 运行态
}

// 是否表现画布内特征的标志，用来控制是否允许拖拽、原生事件是否触发等
let designMode = DESIGN_MODE.DESIGN

export const getDesignMode = () => designMode

export const setDesignMode = (mode) => {
  designMode = mode
}
