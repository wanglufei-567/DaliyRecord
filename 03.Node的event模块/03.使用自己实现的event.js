const EventEmitter = require('./02.实现event模块');
const util = require('util')
function Girl() {
}
util.inherits(Girl, EventEmitter)

const events = new Girl;
const cry = function(name) {
    console.log('哭', name)
}
events.on('女孩失恋了', cry)
events.on('女孩失恋了', function(name) {
    console.log('吃', name)
})
const shopping = function (name) {
    console.log('逛街',name)
}
events.once('女孩失恋了',shopping);
events.off('女孩失恋了',shopping)
events.off('女孩失恋了',cry);

events.emit('女孩失恋了', 'boy');
events.emit('女孩失恋了', 'boy');

// {女孩失恋了:[fn,fn,fn]}  vue3 mitt