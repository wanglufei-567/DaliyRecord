const EventEmitter = require('events');
const event = new EventEmitter();

event.addListener('事件1', (...arg) => {
  console.log('我是事件1的回调', arg);
});

event.once('事件1', (...arg) => {
  console.log('我是事件1的回调', arg);
});

event.emit('事件1', 123, 'qwe');
event.emit('事件1', 123, 'qwe');

const call = (...arg) => {
  console.log('我是事件2的回调', arg);
};
event.addListener('事件2', call);
event.addListener('事件2', ()=> {
  console.log('事件2的回调')
});

event.emit('事件2', 123, 'qwe');
event.off('事件2', call);
event.emit('事件2', 123, 'qwe');
const eventsName = event.eventNames();
console.log('eventsName', eventsName);
