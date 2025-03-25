/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

export const PADDING_PROPERTY = {
  Padding: 'padding',
  PaddingTop: 'padding-top',
  PaddingRight: 'padding-right',
  PaddingBottom: 'padding-bottom',
  PaddingLeft: 'padding-left'
}

export const MARGIN_PROPERTY = {
  Margin: 'margin',
  MarginTop: 'margin-top',
  MarginRight: 'margin-right',
  MarginBottom: 'margin-bottom',
  MarginLeft: 'margin-left'
}

export const SPACING_PROPERTY = {
  ...MARGIN_PROPERTY,
  ...PADDING_PROPERTY
}

export const SIZE_PROPERTY = {
  Width: 'width',
  Height: 'height',
  MinWidth: 'min-width',
  MaxWidth: 'max-width',
  MinHeight: 'min-height',
  MaxHeight: 'max-height',
  Overflow: 'overflow',
  ObjectFit: 'object-fit',
  ObjectPosition: 'object-position'
}

export const TYPO_PROPERTY = {
  FontSize: 'font-size',
  LineHeight: 'line-height',
  Color: 'color',
  TextAlign: 'text-align',
  FontStyle: 'font-style',
  TextDecoration: 'text-decoration',
  FontWeight: 'font-weight',
  FontFamily: 'font-family'
}

export const BORDER_STYLE_PROPERTY = {
  BorderStyle: 'border-style',
  BorderTopStyle: 'border-top-style',
  BorderRightStyle: 'border-right-style',
  BorderBottomStyle: 'border-bottom-style',
  BorderLeftStyle: 'border-left-style'
}

export const BORDER_WIDTH_PROPERTY = {
  BorderWidth: 'border-width',
  BorderTopWidth: 'border-top-width',
  BorderRightWidth: 'border-right-width',
  BorderBottomWidth: 'border-bottom-width',
  BorderLeftWidth: 'border-left-width'
}

export const BORDER_COLOR_PROPERTY = {
  BorderColor: 'border-color',
  BorderTopColor: 'border-top-color',
  BorderRightColor: 'border-right-color',
  BorderBottomColor: 'border-bottom-color',
  BorderLeftColor: 'border-left-color'
}

export const BORDER_PROPERTY = {
  Border: 'border',
  ...BORDER_STYLE_PROPERTY,
  ...BORDER_WIDTH_PROPERTY,
  ...BORDER_COLOR_PROPERTY
}

export const BORDER_RADIUS_PROPERTY = {
  BorderRadius: 'border-radius',
  BorderTopLeftRadius: 'border-top-left-radius',
  BorderTopRightRadius: 'border-top-right-radius',
  BorderBottomLeftRadius: 'border-bottom-left-radius',
  BorderBottomRightRadius: 'border-bottom-right-radius'
}

export const GRID_PROPERTY = {
  GridGap: 'grid-gap',
  GridColumnGap: 'grid-column-gap',
  GridRowGap: 'grid-row-gap',
  GridAutoFlow: 'grid-auto-flow',
  AlignItems: 'align-items',
  JustifyItems: 'justify-items',
  AlignContent: 'align-content',
  JustifyContent: 'justify-content'
}

export const POSITION_PROPERTY = {
  Position: 'position',
  Inset: 'inset',
  Top: 'top',
  Right: 'right',
  Bottom: 'bottom',
  Left: 'left',
  Float: 'float',
  Clear: 'clear',
  ZIndex: 'z-index'
}

export const FLEX_PROPERTY = {
  FlexDirection: 'flex-direction',
  JustifyContent: 'justify-content',
  AlignItems: 'align-items',
  FlexWrap: 'flex-wrap'
}

export const BACKGROUND_PROPERTY = {
  BackgroundColor: 'background-color',
  BackgroundClip: 'background-clip',
  BackgroundImage: 'background-image',
  BackgroundPosition: 'background-position',
  BackgroundSize: 'background-size',
  BackgroundRepeat: 'background-repeat',
  BackgroundAttachment: 'background-attachment',
  TextFillColor: '-webkit-text-fill-color'
}

export const EFFECTS_PROPERTY = {
  Opacity: 'opacity',
  Cursor: 'cursor',
  Outline: 'outline',
  OutlineOffset: 'outline-offset'
}

export const Style_Property = {
  ...SIZE_PROPERTY,
  ...TYPO_PROPERTY,
  ...PADDING_PROPERTY,
  ...MARGIN_PROPERTY,
  ...BORDER_PROPERTY,
  ...BORDER_RADIUS_PROPERTY,
  ...GRID_PROPERTY,
  ...POSITION_PROPERTY,
  ...FLEX_PROPERTY,
  ...BACKGROUND_PROPERTY,
  ...EFFECTS_PROPERTY
}

export const UNIT_OPTIONS = [
  {
    label: 'px',
    value: 'px'
  },
  {
    label: '%',
    value: '%'
  },
  {
    label: 'vw',
    value: 'vw'
  },
  {
    label: 'vh',
    value: 'vh'
  },
  {
    label: 'em',
    value: 'em'
  },
  {
    label: 'rem',
    value: 'rem'
  },
  {
    label: '-',
    value: 'auto'
  }
]

export const BACKGROUND_SIZE_OPTIONS = [
  {
    label: 'Custom',
    value: 'custom'
  },
  {
    label: 'Cover',
    value: 'cover'
  },
  {
    label: 'Contain',
    value: 'contain'
  }
]

export const FIXED_OPTIONS = [
  {
    label: '固定',
    value: 'fixed'
  },
  {
    label: '不固定',
    value: 'scroll'
  }
]

export const REPEAT_OPTIONS = [
  {
    content: '水平垂直轴都重复',
    icon: 'tile-xy',
    value: 'repeat'
  },
  {
    content: '水平轴重复',
    icon: 'tile-x',
    value: 'repeat-x'
  },
  {
    content: '垂直轴重复',
    icon: 'tile-y',
    value: 'repeat-y'
  },
  {
    content: '不重复',
    icon: 'close',
    value: 'no-repeat'
  }
]

export const RADIAL_SIZE_LIST = [
  {
    content: 'Closest side extends the gradient from the defined position to the closest side.',
    icon: 'closest-side',
    value: 'closest-side'
  },
  {
    content: 'Closest corner extends the gradient from the defined position to the closest corner.',
    icon: 'closest-corner',
    value: 'closest-corner'
  },
  {
    content: 'Farthest side extends the gradient from the defined position to the farthest side.',
    icon: 'farthest-side',
    value: 'farthest-side'
  },
  {
    content: 'Farthest corner extends the gradient from the defined position to the farthest corner.',
    icon: 'farthest-corner',
    value: 'farthest-corner'
  }
]

export const TYPE_TEXT = {
  ImageSetting: 'background-image.svg',
  LinearGradient: 'Linear gradient',
  RadialGradient: 'Radial gradient'
}

export const PROPERTY_DEFAULT_VALUE = {
  'background-position': '0px 0px',
  'background-size': 'auto',
  'background-repeat': 'repeat',
  'background-scroll': 'scroll'
}
