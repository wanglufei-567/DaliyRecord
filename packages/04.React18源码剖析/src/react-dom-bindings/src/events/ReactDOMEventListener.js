import getEventTarget from './getEventTarget';
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree';
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem';
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority
} from 'react-reconciler/src/ReactEventPriorities';

/**
 * @description 创建事件的的监听函数
 * @param {*} targetContainer 容器div#root
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 */
export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * 派发离散的事件的的监听函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器div#root
 * @param {*} nativeEvent 原生的事件 浏览器给的event参数
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  //点击的时候，需要设置更新优先级
  //先获取当前老的更新优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    //把当前的更新优先级设置为离散事件优先级 1
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(
      domEventName,
      eventSystemFlags,
      container,
      nativeEvent
    );
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
}

/**
 * @description 此方法就是委托给容器的回调，
 * 当容器#root在捕获或者说冒泡阶段处理事件的时候会执行此函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} targetContainer 容器div#root
 * @param {*} nativeEvent 原生的事件 浏览器给的event参数
 */
export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 获取该真实DOM对应的fiber
  const targetInst = getClosestInstanceFromNode(nativeEventTarget);

  // 从事件插件系统中派发事件
  dispatchEventForPluginEventSystem(
    domEventName, //click
    eventSystemFlags, //0 4
    nativeEvent, //原生事件
    targetInst, //此真实DOM对应的fiber
    targetContainer //目标容器
  );
}

/**
 * 获取事件优先级
 * @param {*} domEventName 事件的名称 click
 */
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case 'click':
      return DiscreteEventPriority;
    case 'drag':
      return ContinuousEventPriority;
    default:
      return DefaultEventPriority;
  }
}
