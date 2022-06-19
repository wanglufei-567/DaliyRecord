import { createRenderer } from '@vue/runtime-core';

import { nodeOps } from './nodeOps';

import { patchProp } from './patchProp';

export * from '@vue/runtime-core';

const renderOptions = { patchProp, ...nodeOps };

/**
 * vue内置的渲染器
 * 使用createRenderer搭配内置的renderOptions（浏览器平台的渲染配置项）
 * 创建的渲染器
 */
export function render(vnode, container) {
  let { render } = createRenderer(renderOptions);
  return render(vnode, container);
}
