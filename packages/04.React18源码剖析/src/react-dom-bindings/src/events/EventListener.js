/**
 * @description 添加捕获阶段的事件监听方法
 */
export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true);
  return listener;
}

/**
 * @description 添加冒泡阶段的事件监听方法
 */
export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, false);
  return listener;
}