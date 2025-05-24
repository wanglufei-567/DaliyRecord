class Queue {
    constructor() {
        this.count = 0
        this.lowestCount = 0 // 用于记录队头元素
        this.items = {}
    }

    // 获取队列中元素个数
    size() {
        return this.count - this.lowestCount
    }

    // 检查队列是否为空
    isEmpty() {
        return this.size === 0
    }

    // 向队列添加元素
    enqueue(element) {
        this.items[this.count] = element
        this.count++
    }

    // 从队列移出元素
    dequeue() {
        if (this.isEmpty()) return
        const result = this.items[this.lowestCount]
        delete this.items[this.lowestCount]
        this.lowestCount++
        return result
    }

    // 查看队头元素
    peek() {
        if (this.isEmpty()) return
        return this.items[this.lowestCount]
    }

    // 清空队列
    clear() {
        this.items = {}
        this.count = 0
        this.lowestCount = 0
    }

    // 查看元素的方法
    toString() {
        if (this.isEmpty()) return
        let objString = `${this.items[this.lowestCount]}`
        for (let i = this.lowestCount + 1; i < this.count; i++) {
            objString = `${objString},${this.items[i]}`
        }
        return objString
    }
}

// 实际应用，击鼓传花
/*
击鼓传花
所有人围成一个圈，把花传递给旁边的人，某一时刻这个花在谁手里，谁就淘汰出局
重复这个过程，直到剩下最后一个人
 */
function hotPotato(list, num) {
    const queue = new Queue()
    const eliminatedList = []

    for (let i = 0; i < list.length; i++) {
        queue.enqueue(list[i])
    }

    while (queue.size() > 1) {
        for (let i = 0; i < num; i++) {
            queue.enqueue(queue.dequeue()) // 从队头移出一项并将其添加到队尾
        }
        eliminatedList.push(queue.dequeue()) // 一旦达到给定的传递次数就将队首的移出
    }

    return {
        eliminated: eliminatedList,
        winner: queue.dequeue(),
    }
}

const result = hotPotato(['John', 'Jack', 'Li', 'carl', 'James'], 10)
console.log('eliminated', result.eliminated)
// eliminated [ 'John', 'carl', 'Jack', 'Li' ]

console.log('winner', result.winner)
// winner James

// 双端队列
class Deque {
    constructor() {
        this.count = 0
        this.lowestCount = 0 // 用于记录队头元素
        this.items = {}
    }

    // 获取队列中元素个数
    size() {
        return this.count - this.lowestCount
    }

    // 检查队列是否为空
    isEmpty() {
        return this.size === 0
    }

    // 像双向队列队尾添加元素
    addBack(element) {
        this.items[this.count] = element
        this.count++
    }

    // 向双向队列队首添加元素
    addFront(element) {
        if (this.isEmpty()) {
            this.addBack(element)
        } else if (this.lowestCount > 0) {
            this.lowestCount--
            this.items[this.lowestCount] = element
        } else {
            for (let i = this.count; i > 0; i--) {
                this.items[i] = this.items[i - 1]
            }
            this.count++
            this.lowestCount = 0
            this.items[0] = element
        }
    }

    // 从队列队首移出元素
    removeFront() {
        if (this.isEmpty()) return
        const result = this.items[this.lowestCount]
        delete this.items[this.lowestCount]
        this.lowestCount++
        return result
    }

    // 从队列队尾移除元素
    removeBack() {
        if (this.isEmpty()) return
        const result = this.items[this.count - 1]
        delete this.items[this.lowestCount - 1]
        this.count--
        return result
    }

    // 查看队头元素
    peekFront() {
        if (this.isEmpty()) return
        return this.items[this.lowestCount]
    }

    // 查看队尾元素
    peekBack() {
        if (this.isEmpty()) return
        return this.items[this.count - 1]
    }

    // 清空队列
    clear() {
        this.items = {}
        this.count = 0
        this.lowestCount = 0
    }

    // 查看元素的方法
    toString() {
        if (this.isEmpty()) return
        let objString = `${this.items[this.lowestCount]}`
        for (let i = this.lowestCount + 1; i < this.count; i++) {
            objString = `${objString},${this.items[i]}`
        }
        return objString
    }
}

// 实际应用，回文检查器
function palindromeChecker(aString) {
    if (aString === undefined || aString === null || aString.length === 0) return false

    const queue = new Deque()
    const lowerString = aString.toLocaleLowerCase().split(' ').join('')
    let isEqual = true
    let firstChar, lastChar

    for(let i=0; i<lowerString.length ; i++){
      queue.addBack(lowerString.charAt(i))
    }

    while(queue.size() > 1 && isEqual) {
      firstChar = queue.removeFront()
      lastChar = queue.removeBack()
      if(firstChar !== lastChar) {
        isEqual = false
      }
    }

    return isEqual
}

console.log('level', palindromeChecker('level')); // true
console.log('kaka', palindromeChecker('kaka')); // false
