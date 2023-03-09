class Node {
  constructor(element, next) {
    this.element = element;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null; // 链表的头
    this.size = 0; // 链表的大小
  }

  // 根据索引找到某一项
  _getNode(index) {
    let node = this.head;
    for (let i = 0; i < index; index++) {
      node = node.next;
    }
    return node;
  }

  // 添加
  add(index, element) {
    if (arguments.length === 1) {
      // 若添加时没有指定位置则默认是往链表的尾部添加
      element = index;
      index = this.size;
    }

    if (index === 0) {
      // index为0则说明是往链表的头部添加
      const oldHead = this.head;
      // 将原有的头部置为添加项的下一项，即element.next = oldHead;
      this.head = new Node(element, oldHead);
    } else {
      // 找到添加项奖添加位置处的上一项
      let prevNode = this._getNode(index - 1);
      prevNode.next = new Node(element, prevNode.next);
    }

    this.size++;
  }

  remove(index) {
    let removeNode = null;
    if (index === 0) {
      removeNode = this.head;
      this.head = this.head.next;
    } else {
      const prevNode = this._getNode(index - 1);
      removeNode = prevNode.next;
      prevNode.next = new Node(element, prevNode.next.next);
    }
    this.size--;
    return removeNode;
  }

  update(index, element) {
    let node = this._getNode(index);
    node.element = element;
    return node;
  }
  getNode(index) {
    return this._getNode(index);
  }

  reverse() {
    let node = this.head;

    if (node === null || node.next == null) return node;

    // 新链表的头部
    let newHead = null;
    while (node) {
      // 将正在操作那一项的next存起来
      let n = node.next;
      // 将正在操作那一项的next指向新链表的头部
      node.next = newHead;
      // 重置新链表的头部
      newHead = node;
      // 调整操作项
      node = n;
    }
    return newHead;
  }
}

const link = new LinkedList();
link.add('first');
link.add('second');
link.add(1, 'insert');
console.dir(link, { depth: 100 });

const newLink = link.reverse();
console.dir(newLink, { depth: 100 });


