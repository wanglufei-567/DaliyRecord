import hasOwnProperty from 'shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

/**
 * 保留属性，不会写到虚拟DOM中的props中去
 */
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
}


/**
 * 校验ref属性是否有效
 */
function hasValidRef(config) {
  return config.ref !== undefined;
}

/**
 * @description 生成虚拟DOM
 * @param type 元素类型
 * @param key 唯一标识
 * @param ref 用来获取真实DOM元素
 * @param props 属性对象
 */
function ReactElement(type, key, ref, props) {
  //返回值就是React元素，也被称为虚拟DOM
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props
  }
}

/**
 * @description 将JSX转换为虚拟DOM的方法，Babel编译JSX之后的结果就是此函数的调用
 * React17以前老版的转换函数中key 是放在config里的,第三个参数放children
 * React17之后新版的转换函数中key是在第三个参数中的，children是放在config里的
 * @param type 元素类型
 * @param config babel转译JSX之后，根据原始JSX自动生成的配置信息
 */
export function jsxDEV(type, config, maybeKey) {
  // 属性名
  let propName;
  // 属性对象
  const props = {};
  // 每个虚拟DOM可以有一个可选的key属性，用来区分一个父节点下的不同子节点
  let key = null;
  //可以通过ref实现获取真实DOM的需求
  let ref = null;

  if (typeof maybeKey !== 'undefined') {
    key = maybeKey;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 遍历config，将属性信息挂到props中去
  for (propName in config) {
    if (hasOwnProperty.call(config, propName)
      && !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName]
    }
  }

  // 生成最终的虚拟DOM
  return ReactElement(type, key, ref, props);
}