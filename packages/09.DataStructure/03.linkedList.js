function defaultEquals(a, b) {
  return a === b
}

class Node {
  constructor(element) {
    this.element = element
    this.next = undefined
  }
}

class LinkedList {
  constructor(equalsFn = defaultEquals) {
    this.count = 0
    this.head = undefined
    this.equalsFn = equalsFn
  }

  // 向链表尾添加一个元素
  push(element) {
    const node = new Node(element)
    let current
    if (this.head === undefined) {
      this.head = node
    } else {
      current = this.head
      while (current.next !== undefined) {
        current = current.next
      }
      current.next = node
    }
    this.count++
  }

  // 返回链表中特定位置的元素
  getElementAt(index) {
    if (index >= 0 && index <= this.count) {
      let node = this.head
      for (let i = 0; i < index && node !== null; i++) {
        node = node.next
      }
      return node
    }
    return undefined
  }

  // 向链表特定位置插入一个元素
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element)
      if (index === 0) {
        const current = this.head
        node.next = current
        this.head = node
      } else {
        const previous = this.getElementAt(index - 1)
        const current = previous.next
        previous.next = node
        node.next = current
      }
      this.count++
      return true
    }
    return false
  }

  // 从链表指定位置移出一个元素
  removeAt(index) {
    if (index >= 0 && index <= this.count) {
      let current = this.head
      if (index === 0) {
        this.head = current.next
      } else {
        const previous = this.getElementAt(index - 1)
        current = previous.next
        previous.next = current.next
      }
      this.count--
      return current.element
    }
    return undefined
  }

  // 返回元素在链表中的索引
  indexOf(element) {
    let current = this.head
    for (let i = 0; i < this.count && current !== null; i++) {
      if (this.equalsFn(element, current.element)) return i
      current = current.next
    }
    return -1
  }

  // 从链表中移出一个元素
  remove(element) {
    const index = this.indexOf(element)
    this.removeAt(index)
  }

  // 返回链表元素个数
  size() {
    return this.count
  }

  // 检查链表是否为空
  isEmpty() {
    return this.size() === 0
  }

  // 返回表示整个链表的字符串
  toString() {
    if (this.head === undefined) {
      return ''
    }
    let objString = `${this.head.element}`
    let current = this.head.next
    for (let i = 1; i < this.size() && current !== undefined; i++) {
      objString = `${objString}${current.next.element}`
      current = current.next
    }
    return objString
  }
}

class DoublyNode extends Node {
  constructor(element, next, prev) {
    super(element, next)
    this.prev = prev
  }
}

// 双向链表
// 在单向链表中，若是迭代错过了要找的元素，就需要回到起点，从新开始迭代，而双向链表则不需要
class DoubleLinkedList {
  constructor(equalsFn = defaultEquals) {
    super(equalsFn)
    this.tail = undefined // 指向尾部元素
  }

  // 在任意位置插入新元素
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new DoublyNode(element)
      let current = this.head
      if (index === 0) {
        // 头部
        if (this.head === undefined) {
          this.head = node
          this.tail = node
        } else {
          node.next = this.head
          current.prev = node
          this.head = node
        }
      } else if (index === count) {
        // 尾部
        current = this.tail
        current.next = node
        node.prev = current
        this.tail = node
      } else {
        // 中间
        const previous = this.getElementAt(index - 1) // 当前 index 前面的元素
        current = previous.next // 当前 index 位置处的元素
        node.next = current
        previous.next = node
        current.prev = node
        node.prev = previous
      }
      this.count++
      return true
    }
    return false
  }

  // 从任意位置移出元素
  removeAt(index) {
    if (index >= 0 && index <= this.count) {
      let current = this.head
      if (index === 0) {
        // 头部
        this.head = current.next // head 指向后一个元素
        if (this.count === 1) {
          // 只有一个元素
          this.tail = undefined
        } else {
          this.head.prev = undefined
        }
      } else if (index === this.count - 1) {
        // 尾部
        current = this.tail
        this.tail = current.prev // tail 指向前一个元素
        this.tail.next = undefined // 取消前一个元素的 next 指向
      } else {
        // 中间
        current = this.getElementAt(index)
        const previous = current.prev
        previous.next = current.next // 前一个元素的 next 指向后一个元素
        current.next.prev = previous // 后一个元素的 prev 指向前一个元素
      }
      this.count--
      return current.element
    }
    return undefined
  }
}

// 循环链表
class CircularLinkedList extends LinkedList {
  constructor(equalsFn = defaultEquals) {
    super(equalsFn)
  }

  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element)
      let current = this.head
      if (index === 0) {
        if (this.head === null) {
          this.head = node
          node.next = this.head
        } else {
          node.next = current
          current = this.getElementAt(this.size())
          this.head = node
          current.next = this.head
        }
      } else {
        const previous = this.getElementAt(index - 1)
        node.next = previous.next
        previous.next = node
      }
      this.count++
      return true
    }
    return false
  }

  removeAt(index) {
    if (index >= 0 && index <= this.count) {
      let current = this.head
      if (index === 0) {
        if (this.size() === 1) {
          this.head = null
        } else {
          const removed = this.head
          current = this.getElementAt(this.size())
          this.head = this.head.next
          current.next = this.head
          current = removed
        }
      } else {
        const previous = this.getElementAt(index - 1)
        current = previous.next
        previous.next = current.next
      }
      this.count--
      return current.element
    }
    return undefined
  }
}

// 有序链表
// 有序链表是指保持元素有序的链表结构
const Compare = {
  LESS_THAN: -1,
  BIGGER_THAN: 1,
}

function defaultCompare(a, b) {
  if (a === b) {
    return 0
  }
  return a < b ? Compare.LESS_THAN : Compare.BIGGER_THANz
}

class StoredLinkedList extends LinkedList {
  constructor(equalsFn = defaultEquals, compareFn = defaultCompare) {
    super(equalsFn)
    this.compareFn = compareFn
  }

  insert(element, index =0){ // index 没有用，这里是为了接口统一
    if(this.isEmpty()) {
      return super.insert(element, 0)
    }
    // 找到元素要插入的位
    const pos = this.getIndexNextSortedElement(element)
    return super.insert(element, pos)
  }

  getIndexNextSortedElement(element){
    let current = this.head
    let i = 0
    for(;i <this.size() && current; i++){
      const comp = this.compareFn(element, current.element)
      // 这里的排序规则是升序
      if(comp === Compare.LESS_THAN){
        return i
      }
      current= current.next
    }
    return i
  }
}
