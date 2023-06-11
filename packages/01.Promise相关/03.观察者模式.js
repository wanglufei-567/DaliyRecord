/* 观察者模式的特征就是观察者和被观察者耦合在一起的，被观察者进行消息通知时要调用观察者的更新方法 */

class Subject {
  observerArr = [];

  add(observer) {
    this.observerArr.push(observer);
  }

  notify() {
    this.observerArr.forEach(item => item.update?.());
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }

  update() {
    console.log('我是观察者，我被通知了，我可以做一些更新', this.name);
  }
}

const subject = new Subject();

const observer1 = new Observer('observer1');
const observer2 = new Observer('observer2');

subject.add(observer1);
subject.add(observer2);

subject.notify();
