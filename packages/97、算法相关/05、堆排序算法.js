/**
 * 堆排序是一种基于堆数据结构的比较排序算法。
 *
 * 核心思想：
 * 1. 将待排序数组构建成一个最大堆（或最小堆）
 * 2. 将堆顶元素（最大值）与末尾元素交换
 * 3. 重新调整剩余元素为堆结构
 * 4. 重复步骤2-3，直到所有元素排序完成
 *
 * 特点：
 * - 不稳定排序
 * - 原地排序
 */


function swap(array, a, b) {
  [array[a], array[b]] = [array[b], array[a]]
}

/**
 * 堆化操作
 * 确保 以某个节点为根 的子树满足堆的性质
 *
 * 执行过程：
 * 1. 找出当前节点、左子节点、右子节点中的最值
 * 2. 如果最值不是当前节点，则交换位置
 * 3. 递归地对交换后的位置继续执行堆化
 *
 * 示例：
 * 输入数组：[4, 10, 3, 5, 1]
 * 初始状态：
 *       4
 *     /   \
 *    10    3
 *   / \
 *  5   1
 *
 * 执行 heapify(0) 后：
 *       10
 *     /    \
 *    4      3
 *   / \
 *  5   1
 *
 * @param {Array} array - 要堆化的数组
 * @param {number} index - 当前要堆化的节点索引
 * @param {number} heapSize - 堆的大小
 * @param {Function} compareFn - 比较函数
 */
function heapify(array, index, heapSize, compareFn) {
  let element = index
  const left = 2 * index + 1
  const right = 2 * index + 2
  if (
    left < heapSize &&
    compareFn(array[element], array[left]) === Compare.BIGGER_THAN
  ) {
    element = left
  }
  if (
    right < heapSize &&
    compareFn(array[element], array[right]) === Compare.BIGGER_THAN
  ) {
    element = right
  }
  if (element !== index) {
    swap(array, index, element)
    heapify(array, element, heapSize, compareFn)
  }
}

/**
 * 构建最大堆
 * 将一个数组构建为最大堆
 *
 * 构建最大堆过程：
 * 1. 从 最后一个非叶子节点 开始，执行堆化操作
 * 2. 重复此过程直到根节点
 *
 * 注意：构建最大堆后，数组并不是完全有序的
 * - 只保证根节点是最大的
 * - 只保证每个父节点大于其子节点
 * - 不保证同层节点之间的大小关系
 * - 要得到完全有序的数组，需要继续执行堆排序算法
 *
 * 为什么从 Math.floor(array.length / 2) 开始？
 * 在完全二叉树中，索引大于 Math.floor(array.length/2) 的节点都是叶子节点
 * 叶子节点没有子节点，不需要进行堆化操作
 *
 * 最后一个非叶子节点的索引是 Math.floor(array.length/2) - 1
 * 但从 Math.floor(array.length/2) 开始遍历更简洁
 *
 * 因为：
 * 1、虽然多遍历了一个叶子节点，但 heapify 会立即返回
 * 2、不会影响最终结果，反而让代码更简洁
 *
 * 示例：
 * 输入数组：[4, 10, 3, 5, 1]
 * 初始状态：
 *       4
 *     /   \
 *    10    3
 *   / \
 *  5   1
 *
 * 执行过程：
 * 1. i = 2: 堆化节点 3（叶子节点，无操作）
 * 2. i = 1: 堆化节点 10 及其子树
 * 3. i = 0: 堆化节点 4 及其子树
 *
 * 最终结果：
 *       10
 *     /    \
 *    5      3
 *   / \
 *  4   1
 *  数组：[10, 5, 3, 4, 1]  // 此时数组满足堆的性质，但未完全有序
 *
 * @param {Array} array - 要构建最大堆的数组
 * @param {Function} compareFn - 比较函数
 */
function buildMaxHeap(array, compareFn) {
  for (let i = Math.floor(array.length / 2); i >= 0; i--) {
    heapify(array, i, array.length, compareFn)
  }
}

/**
 * 堆排序算法
 * 将数组按照升序排列
 *
 * 堆排序过程：
 * 1. 构建最大堆
 *    - 此时数组满足堆的性质，但并不是完全有序的
 *    - 只保证根节点是最大的，每个父节点大于其子节点
 *    - 不保证同层节点之间的大小关系
 *
 * 2. 堆排序
 *    - 将根节点（最大值）与末尾元素交换
 *    - 对剩余部分重新堆化
 *    - 重复此过程直到所有元素都处理完
 *
 * 示例：
 * 输入数组：[4, 10, 3, 5, 1]
 *
 * 第一步：构建最大堆
 *       10
 *     /    \
 *    5      3
 *   / \
 *  4   1
 * 数组：[10, 5, 3, 4, 1]  // 此时数组满足堆的性质，但未完全有序
 *
 * 第二步：堆排序
 * 1. 交换 10 和 1，堆化 [1, 5, 3, 4]
 * 2. 交换 5 和 4，堆化 [4, 1, 3]
 * 3. 交换 4 和 3，堆化 [3, 1]
 * 4. 交换 3 和 1，完成
 *
 * 最终结果：[1, 3, 4, 5, 10]
 *
 * @param {Array} array - 要排序的数组
 * @param {Function} compareFn - 比较函数
 * @returns {Array} - 排序后的数组
 */
function heapSort(array, compareFn = defaultCompare) {
  let heapSize = array.length

  // 构建最大堆，但未完全有序
  buildMaxHeap(array, compareFn)

  // 堆排序
  while (heapSize > 1) {
    heapSize--
    swap(array, 0, heapSize)
    heapify(array, 0, heapSize, compareFn)
  }
  return array
}