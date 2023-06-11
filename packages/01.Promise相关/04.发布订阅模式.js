/* 发布订阅模式的特征是，发布者和订阅者解藕了，订阅者在订阅时将回调传给发布者，发布者管理订阅者的回调，在发布消息时，将指定类型的回调拿出来执行，不会像观察者模式那样，需要被观察者管理观察者，发布消息时，再去将观察者拿出来执行观察者的更新方法，两种模式还是很像的，简单理解就是观察者模式队列中是观察者本身，发布订阅模式队列中是订阅者传进来的回调 */

class Pubsub {
  keys={};

  subscribe(key,fn) {
    if(!this.keys[key]){
      this.keys[key] = [];
    }
    this.keys[key].push(fn)
  }

  publish(key,data){
    this.keys[key].forEach(element => element(data));
  }
}

const pubsub = new Pubsub();

pubsub.subscribe('key1', (data) => {
  console.log('我订阅了key1', data)
})

pubsub.subscribe('key1', (data) => {
  console.log('我也订阅了key1', data)
})

pubsub.publish('key1', '我发布了一些消息')