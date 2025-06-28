/**
 * 将CSS中的px单位转换为rpx单位
 * @param {string} css CSS样式字符串
 * @returns {string} 转换后的CSS字符串
 */
export const convertPxToRpx = (css) => {
  if (!css) return css;
  
  return css.replace(/\b(\d*\.?\d+)px\b/g, (match, num) => {
    if (parseFloat(num) === 0) return '0';
    return `${num}rpx`;
  });
};