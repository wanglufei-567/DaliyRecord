import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import {
  addEventCaptureListener,
  addEventBubbleListener
} from './EventListener';
import getEventTarget from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';

// 先完成事件名的注册
SimpleEventPlugin.registerEvents();

const listeningMarker =
  `_reactListening` + Math.random().toString(36).slice(2);

/**
 * @description 监听根容器
 * @param rootContainerElement 根容器，也就是div#root
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  //只监听一次
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    // 遍历所有的原生的事件比如click,进行监听
    allNativeEvents.forEach(domEventName => {
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}

/**
 * @description 注册原生事件
 * @param {*} domEventName 原生事件 click
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 * @param {*} target 目标DOM节点 div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target
) {
  let eventSystemFlags = 0; //默认是0指的是冒泡 4是捕获
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

/**
 * @description 注册原生事件
 * @param {*} targetContainer 目标DOM节点 div#root 容器节点
 * @param {*} domEventName 原生事件 click
 * @param {*} eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  // 创建事件监听的方法
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );

  // 添加事件监听方法
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

/**
 * @description 分派事件
 * @param domEventName 原生事件名 click
 * @param eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param targetInst 此真实DOM对应的fiber
 * @param targetContainer 目标容器 div#root
 */
export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 给插件分派事件
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer
  );
}

/**
 * @description 分派事件
 * @param domEventName 原生事件名 click
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param targetInst 此真实DOM对应的fiber
 * @param targetContainer 目标容器 div#root
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  //派发事件的队列
  const dispatchQueue = [];
  // 从下往上遍历fiber链，并提取事件
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
  // 执行派发队列中的事件监听方法
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

/**
 * @description 从下往上遍历fiber链，并提取事件
 * @param dispatchQueue 派发事件的数组
 * @param domEventName 原生事件名 click
 * @param targetInst 此真实DOM对应的fiber
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param nativeEventTarget 事件源，它是一个真实DOM
 * @param eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param targetContainer 目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * @description 执行派发队列中的事件监听方法
 * @param dispatchQueue 派发队列，里面放置我们的监听函数
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 */
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  //判断是否在捕获阶段
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  // 遍历派发队列，执行事件监听的方法
  // dispatchQueue 长这样[{event:事件1, listeners:[...]},{event:事件2, listeners:[...]}]
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(
      event, // 合成事件对象
      listeners, // 事件监听方法的队列
      inCapturePhase // true 捕获， false 冒泡
    );
  }
}

/**
 * @description 依次执行派发队列中的事件监听方法
 * @param event 合成事件对象
 * @param dispatchListeners 事件监听方法的队列
 * @param inCapturePhase true 捕获， false 冒泡
 */
function processDispatchQueueItemsInOrder(
  event,
  dispatchListeners,
  inCapturePhase
) {
  if (inCapturePhase) {
    // 捕获阶段

    // dispatchListeners中的顺序[子，父]
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        // 若停止冒泡则直接退出循环
        // event对象是当前事件所有监听方法共有的
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    // 冒泡阶段
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}

/**
 * @description 执行事件监听方法
 * @param event 合成事件对象
 * @param listener 事件监听方法
 * @param currentTarget 当前的事件源
 */
function executeDispatch(event, listener, currentTarget) {
  //合成事件实例currentTarget是在不断的变化的
  // event target 它的是原始的事件源，是永远不变的
  // event currentTarget 当前的事件源，它是会随着事件回调的执行不断变化的
  event.currentTarget = currentTarget;
  listener(event);
}

/**
 * @description 根据fiber和React事件名，向上收集事件监听方法
 * @param targetFiber 此真实DOM对应的fiber
 * @param reactName React事件名
 * @param nativeEventType 事件类型
 * @param isCapturePhase 否是捕获阶段
 * @returns listeners 收集到的时间监听方法的队列
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captureName : reactName;

  // 事件监听方法的队列，用于存储一条fiber链上每个节点相同事件的监听方法
  // 注意：与派发队列区分开来
  const listeners = [];

  let instance = targetFiber;

  // 根据事件源真实DOM节点对应的fiber，向上收集对应的事件监听方法
  while (instance !== null) {
    //stateNode 真实DOM节点
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      // 获取此fiber上对应的回调函数
      const listener = getListener(instance, reactEventName);

      // 将事件监听方法添加到监听方法的队列中
      if (listener) {
        listeners.push(
          createDispatchListener(instance, listener, stateNode)
        );
      }
    }

    instance = instance.return;
  }

  return listeners;
}

/**
 * @param instance fiber实例
 * @param listener 监听方法
 * @param currentTarget fiber对应的真实DOM节点
 */
function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}
