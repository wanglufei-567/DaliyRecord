const Compare = {
  LESS_THAN: -1,
  BIGGER_THAN: 1,
}

// 比较函数
function defaultCompare(a, b) {
  if (a === b) {
    return 0
  }
  return a < b ? Compare.LESS_THAN : Compare.BIGGER_THANz
}

// 二叉堆是一种完全二叉树，适合使用数组来实现

/**
 * 最小堆
 * 最小堆的根节点是最小的元素
 */
class MinHeap {
  constructor(compareFn = defaultCompare) {
    this.compareFn = compareFn
    this.heap = []
  }

  // 获取左子节点的索引
  getLeftIndex(index) {
    return 2 * index + 1
  }

  // 获取右子节点的索引
  getRightIndex(index) {
    return 2 * index + 2
  }

  // 获取父节点的索引
  getParentIndex(index) {
    return Math.floor((index - 1) / 2)
  }

  // 插入元素
  insert(value) {
    if (value !== null) {
      this.heap.push(value)
      // 上移操作, 将新插入的元素上移到合适的位置，从最后一个元素开始往上移动
      this.siftUp(this.heap.length - 1)
      return true // 插入成功
    }
    return false // 插入失败
  }

  // 交换位置
  swap(index1, index2) {
    const temp = this.heap[index1]
    this.heap[index1] = this.heap[index2]
    this.heap[index2] = temp
  }

  // 上移操作
  siftUp(index) {
    // 先获取父节点的索引
    let parent = this.getParentIndex(index)
    // 如果当前节点大于父节点，则交换位置
    while (
      index > 0 &&
      this.compareFn(this.heap[index], this.heap[parent]) === Compare.BIGGER_THAN
    ) {
      // 交换位置
      this.swap(parent, index)
      index = parent
      parent = this.getParentIndex(index)
    }
  }

  size() {
    return this.heap.length
  }

  isEmpty() {
    return this.size() === 0
  }

  findMinimum() {
    return this.isEmpty() ? undefined : this.heap[0]
  }

  /**
   * 移除最小值
   * 先移除堆顶元素，然后进行下移操作，将最后一个元素移到根节点
   * 然后进行下移操作，将根节点下移到合适的位置，从而满足堆的性质
   */
  extract() {
    if (this.isEmpty()) {
      return undefined
    }
    if (this.size() === 1) {
      return this.heap.shift()
    }
    const removedValue = this.heap[0]
    // 将最后一个元素移到根节点
    this.heap[0] = this.heap.pop()
    // 下移操作, 将根节点下移到合适的位置，从根节点开始往下移动
    this.siftDown(0)
    return removedValue
  }

  /**
   * 下移操作
   * 将根节点下移到合适的位置，从而满足堆的性质
   *
   * 下移过程：
   * 1. 从当前节点开始，比较当前节点与其左右子节点的值
   * 2. 找到三个节点中值最小的节点（对于最小堆）
   * 3. 如果最小值不是当前节点，则将当前节点与最小值节点交换位置
   * 4. 递归地对交换后的位置继续执行下移操作
   * 5. 重复此过程直到当前节点比其所有子节点都小，或者到达叶子节点
   *
   * @param {number} index 当前节点的索引
   */
  siftDown(index) {
    // element 用于记录当前节点、左子节点、右子节点中值最小的节点索引
    // 初始化为当前节点索引，后续会根据比较结果更新为最小值节点的索引
    let element = index
    // 获取左子节点的索引
    const left = this.getLeftIndex(index)
    // 获取右子节点的索引
    const right = this.getRightIndex(index)
    // 获取堆的大小
    const size = this.size()
    // 如果左子节点存在，并且左子节点的值小于当前 element 指向的节点值，则更新 element 为左子节点索引
    if (
      left < size &&
      this.compareFn(this.heap[element], this.heap[left]) === Compare.BIGGER_THAN
    ) {
      element = left
    }
    // 如果右子节点存在，并且右子节点的值小于当前 element 指向的节点值，则更新 element 为右子节点索引
    // 注意：这里比较的是右子节点与当前 element（可能是原节点或左子节点）的值
    if (
      right < size &&
      this.compareFn(this.heap[element], this.heap[right]) === Compare.BIGGER_THAN
    ) {
      element = right
    }
    if (element !== index) {
      this.swap(element, index)
      this.siftDown(element)
    }
  }
}

function reverseCompare(compareFn) {
  return (a, b) => compareFn(b, a)
}

/**
 * 最大堆
 * 最大堆的根节点是最大的元素
 *
 * 最大堆继承自最小堆
 * 只需要重写 compareFn 函数
 */
class MaxHeap extends MinHeap {
  constructor(compareFn = defaultCompare) {
    super(compareFn)
    this.compareFn = reverseCompare(compareFn)
  }
}








