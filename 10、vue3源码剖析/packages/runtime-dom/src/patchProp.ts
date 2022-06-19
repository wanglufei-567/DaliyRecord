import { patchAttr } from './patch-prop/patchAttr';
import { patchClass } from './patch-prop/patchClass';
import { patchEvent } from './patch-prop/patchEvent';
import { patchStyle } from './patch-prop/patchStyle';

/**
 * 对节点属性的操作
 * 给属性打补丁 {style:{color:'red'}}   {style:{}}
 */
export const patchProp = (el, key, preValue, nextValue) => {
  if (key === 'class') {
    // 类名
    patchClass(el, nextValue);
  } else if (key === 'style') {
    // 行内样式
    patchStyle(el, preValue, nextValue);
  } else if (/on[^a-z]/.test(key)) {
    // 事件 onClick onMousedown
    patchEvent(el, key, nextValue);
  } else {
    // 其他属性
    patchAttr(el, key, nextValue);
  }
};
