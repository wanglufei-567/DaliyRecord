function EventEmitter() {
  this._events = {};
}
// on 创建指定事件的回调队列
EventEmitter.prototype.on = function (eventName, callback) {
  if (!this._events) this._events = {};
  const callbacks = this._events[eventName] || [];
  callbacks.push(callback);
  this._events[eventName] = callbacks;
};
// emit 将回调队列中的回调拿出来执行
EventEmitter.prototype.emit = function (eventName, ...args) {
  if (!this._events) this._events = {};
  let callbacks = this._events[eventName];
  if (callbacks) {
    callbacks.forEach(cb => cb(...args));
  }
};
// off 从回调队列中移除回调
EventEmitter.prototype.off = function (eventName, callback) {
  if (!this._events) this._events = {};
  if (this._events[eventName]) {
    this._events[eventName] = this._events[eventName].filter(
      fn => fn != callback && fn.l != callback
    );
  }
};
// once 只执行一次的回调
EventEmitter.prototype.once = function (eventName, callback) {
  const one = (...args) => {
    callback(...args);
    // 执行完毕后
    // 删除事件啊
    this.off(eventName, one);
  };
  // 先绑定事件
  one.l = callback; // 放进队列中的是one,因此需要和原本的回调绑定下，以便可以进行删除
  this.on(eventName, one);
};
module.exports = EventEmitter;

// on emit off once 基本的四个方法，必须非常流利的写出来
