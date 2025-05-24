// 基于数组的栈
class ArrayBasedStack {
    constructor() {
        this._elements = []
    }

    // 添加元素到栈顶
    push(element) {
        this._elements.push(element)
    }

    // 从栈顶移出元素
    pop() {
        return this._elements.pop()
    }

    // 获取栈顶元素
    peek() {
        return this._elements[this._elements.length - 1]
    }

    // 检查栈顶是否为空
    isEmpty() {
        return this._elements.length === 0
    }

    // 获取栈中元素个数
    size() {
        return this._elements.length
    }

    // 清空栈
    clear() {
        this._elements = []
    }
}

// 基于 JS 对象的栈
/*
创建一个 Stack 最简单的方式是使用一个数组来存储其元素，但同样需要评估如何操作元素是最高效的
在使用数组时，大部分方法的时间复杂度你是 O(n)，最坏的情况下需要迭代整个数组的长度才能找到我们想要的那个元素
使用 JS 对象来存储元素，可以占用更少的内存空间，并且仍然保证所有元素按照我们的需要进行排序
*/

class ObjectBasedStack {
    constructor() {
        this._count = 0
        this._elements = {}
    }

    // 添加元素到栈顶
    push(element) {
        this._elements[this._count] = element
        this._count++
    }

    // 检查栈顶是否为空
    isEmpty() {
        return this._count === 0
    }

    // 获取栈中元素个数
    size() {
        return this._count
    }

    // 从栈顶移出元素
    pop() {
        if (this.isEmpty()) return
        this._count--
        const result = this._elements[this._count]
        delete this._elements[this._count]
        return result
    }

    // 获取栈顶元素
    peek() {
        if (this.isEmpty()) return
        return this._elements[this._count - 1]
    }

    // 清空栈
    clear() {
        this._count = 0
        this._elements = {}
    }

    // 展示栈中所有元素
    toString(){
      if(this.isEmpty()) return ''
      let objString = `${this._elements[0]}`
      for(let i = 1; i < this._count; i++) {
        objString=`${objString},${this._elements[i]}`
      }
      return objString
    }
}

// 实际应用，二进制转换
function decimalToBinary(decNumber){
  const remStack = new ObjectBasedStack()
  let num = decNumber
  let rem
  let binaryString = ''

  while(num >0) {
    rem = Math.floor(num % 2)
    remStack.push(rem)
    num = Math.floor(num / 2)
  }

  while (!remStack.isEmpty()) {
    binaryString += `${remStack.pop().toString()}`
  }

  return binaryString
}
console.log('result',decimalToBinary(10));
