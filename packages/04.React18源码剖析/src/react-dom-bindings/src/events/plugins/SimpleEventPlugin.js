import {
  registerSimpleEvents,
  topLevelEventsToReactNames
} from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheticMouseEvent } from '../SyntheticEvent';

/**
 * @description 从下往上遍历fiber链，并提取事件添加到dispatchQueue中
 * @param dispatchQueue 派发队列，里面放置我们的监听函数
 * @param domEventName 原生事件名 click
 * @param targetInst 此真实DOM对应的fiber
 * @param nativeEvent 原生的事件对象 浏览器给的event参数
 * @param nativeEventTarget 事件源，它是一个真实DOM
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 * @param targetContainer 目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget, //click => onClick
  eventSystemFlags,
  targetContainer
) {
  // 根据真实事件名获取React事件名
  const reactName = topLevelEventsToReactNames.get(domEventName);
  // 是否是捕获阶段
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  //合成事件的构建函数
  let SyntheticEventCtor;
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }

  // 提取事件监听方法
  const listeners = accumulateSinglePhaseListeners(
    targetInst, // 此真实DOM对应的fiber
    reactName, // React事件名
    nativeEvent.type, // 事件类型
    isCapturePhase // 是否是捕获阶段
  );

  // 利用原生的事件对象生成一个合成事件对象，并和事件监听方法队列一起放入到派发队列中
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName, // React事件名
      domEventName, // 原生事件名
      null,
      nativeEvent, // 原生的事件对象 浏览器给的event参数
      nativeEventTarget // 事件源，它是一个真实DOM
    );
    // 注意这里，后面所有的事件监听方法用的是同一个合成事件对象
    dispatchQueue.push({
      event, //合成事件实例
      listeners //事件监听方法队列
    });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
