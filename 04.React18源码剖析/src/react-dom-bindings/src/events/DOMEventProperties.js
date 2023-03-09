import { registerTwoPhaseEvent } from './EventRegistry';

// 维护一个集合用于存储原生事件名与React事件名的对应关系
export const topLevelEventsToReactNames = new Map();

// 维护一个数组用于存储浏览器的事件名，有很多
const simpleEventPluginEvents = [
  'abort',
  'cancel',
  'click'
];

function registerSimpleEvent(domEventName, reactName) {
  //onClick在哪里可以取到
  //workInProgress.pendingProps=React元素或者说虚拟DOM.props
  //const newProps = workInProgress.pendingProps;
  //在源码里 让真实DOM元素   updateFiberProps(domElement, props);
  //const internalPropsKey = "__reactProps$" + randomKey;
  //真实DOM元素[internalPropsKey] = props; props.onClick
  //把原生事件名和处理函数的名字进行映射或者说绑定，click=>onClick
  topLevelEventsToReactNames.set(domEventName, reactName);
  // 注册捕获和冒泡两个阶段的事件
  registerTwoPhaseEvent(reactName, [domEventName]); //'onClick' ['click']
}

/**
 * @description 注册事件，根据原生事件名创建React事件名，并存储它们的对应关系
 */
export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i]; //click
    const domEventName = eventName.toLowerCase(); //click
    const capitalizeEvent =
      eventName[0].toUpperCase() + eventName.slice(1); // Click
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`); //click,onClick
  }
}


// const simpleEventPluginEvents = [
//   'abort',
//   'auxClick',
//   'cancel',
//   'canPlay',
//   'canPlayThrough',
//   'click',
//   'close',
//   'contextMenu',
//   'copy',
//   'cut',
//   'drag',
//   'dragEnd',
//   'dragEnter',
//   'dragExit',
//   'dragLeave',
//   'dragOver',
//   'dragStart',
//   'drop',
//   'durationChange',
//   'emptied',
//   'encrypted',
//   'ended',
//   'error',
//   'gotPointerCapture',
//   'input',
//   'invalid',
//   'keyDown',
//   'keyPress',
//   'keyUp',
//   'load',
//   'loadedData',
//   'loadedMetadata',
//   'loadStart',
//   'lostPointerCapture',
//   'mouseDown',
//   'mouseMove',
//   'mouseOut',
//   'mouseOver',
//   'mouseUp',
//   'paste',
//   'pause',
//   'play',
//   'playing',
//   'pointerCancel',
//   'pointerDown',
//   'pointerMove',
//   'pointerOut',
//   'pointerOver',
//   'pointerUp',
//   'progress',
//   'rateChange',
//   'reset',
//   'resize',
//   'seeked',
//   'seeking',
//   'stalled',
//   'submit',
//   'suspend',
//   'timeUpdate',
//   'touchCancel',
//   'touchEnd',
//   'touchStart',
//   'volumeChange',
//   'scroll',
//   'toggle',
//   'touchMove',
//   'waiting',
//   'wheel'
// ];

