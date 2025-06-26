/**
 * 线段树（Segment Tree）
 *
 * 定义：
 * 线段树（Segment Tree）是一种基于分治思想的二叉树数据结构，专门用于高效处理区间查询和区间更新操作
 * 它将一个数组或区间递归地分割成更小的子区间，每个节点对应一个区间 [left, right]。
 *
 * 核心特征：
 * 1.根节点代表整个数组区间
 * 2.每个非叶子节点 [left, right] 的子节点划分规则：
 *    - 左子节点：[left, mid]
 *    - 右子节点：[mid + 1, right]
 *    - 其中 mid = (left + right) / 2
 * 3.每个叶子节点表示一个单位区间（长度为 1），即 left == right
 * 4.每个内部节点存储其对应区间的统计信息（如区间和、最大值等）
 * 5.树的高度为 O(log n)，其中 n 是数组长度
 *
 * 线段树结构示例（数组 [1, 3, 5, 7]）：
 *                [0,3] sum=16
 *               /            \
 *          [0,1] sum=4    [2,3] sum=12
 *         /       \       /         \
 *    [0,0]=1   [1,1]=3  [2,2]=5   [3,3]=7
 *
 * 这个示例展示了数组 [1, 3, 5, 7] 构建成的线段树结构：
 * - [0,3] 表示区间范围（数组索引），sum=16 是该区间的统计值（区间和）
 * - 在实际的线段树数据结构中，节点通常只存储统计值，区间范围通过递归参数传递
 * - 这里为了演示清晰，同时显示了区间范围和统计值
 * - 叶子节点存储原数组元素值，内部节点存储子区间的合并结果
 *
 * 构建后的线段树数组：
 * [0, 16, 4, 12, 1, 3, 5, 7]
 *
 * 说明：
 * - 索引 0 不使用（为了让父子节点索引关系更简洁：父节点 i，左子节点 2*i，右子节点 2*i+1）
 * - 索引 1 是根节点（整个区间的和 16）
 * — 索引 2 是左子节点（区间 [0,1] 的和 4）
 * — 索引 3 是右子节点（区间 [2,3] 的和 12）
 *
 *
 * 主要应用场景是当数组需要频繁改动，还要频繁计算区间的某些统计值
 * 具体场景：
 * - 区间求和查询：快速计算数组某个区间的和
 * - 区间最值查询：快速找到某个区间的最大值或最小值
 * - 区间更新：批量修改某个区间的所有元素
 * - 动态数组：支持单点更新和区间查询
 *
 * 时间复杂度：
 * - 构建：O(n)
 * - 查询：O(log n)
 * - 更新：O(log n)
 *
 * 优势：
 * 1. 相比暴力查询 O(n)，线段树查询只需 O(log n)
 * 2. 支持动态更新，更新后查询仍然高效
 * 3. 可以处理各种区间操作（求和、最值、异或等）
 *
 */

/**
 * 线段树（Segment Tree）实现
 * 支持区间求和查询和单点更新操作
 */
class SegmentTree {
  constructor(array) {
    this.n = array.length
    /**
     * 线段树需要 4n 的空间
     *
     * 为什么需要 4n 的空间？
     * 1. 线段树是完全二叉树，但不是满二叉树
     * 2. 最坏情况下，树的高度为 log₂(n) + 1
     * 3. 完全二叉树的节点数最多为 2^(h+1) - 1，其中 h 是树的高度
     * 4. 当 n 不是 2 的幂次时，会有很多空节点
     * 5. 为了保证索引关系简单（父节点 i，左子节点 2*i，右子节点 2*i+1），需要预留足够空间
     * 6. 数学证明：4n 是安全的上界，能保证不会数组越界
     */
    this.tree = new Array(4 * this.n)
    this.build(array, 1, 0, this.n - 1)
  }

  /**
   * 构建线段树
   * @param {Array} array - 原始数组
   * @param {number} node - 当前节点索引
   * @param {number} start - 区间左端点
   * @param {number} end - 区间右端点
   */
  build(array, node, start, end) {
    if (start === end) {
      // 叶子节点，存储原数组元素
      this.tree[node] = array[start]
    } else {
      const mid = Math.floor((start + end) / 2)
      // 递归构建左右子树
      this.build(array, 2 * node, start, mid)
      this.build(array, 2 * node + 1, mid + 1, end)
      // 内部节点存储左右子树的和
      this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1]
    }
  }

  /**
   * 区间求和查询
   * @param {number} left - 查询区间左端点
   * @param {number} right - 查询区间右端点
   * @returns {number} - 区间和
   */
  query(left, right) {
    return this._query(1, 0, this.n - 1, left, right)
  }

  _query(node, start, end, left, right) {
    // 查询区间完全不重叠
    if (right < start || end < left) {
      return 0
    }

    // 当前区间完全包含在查询区间内
    if (left <= start && end <= right) {
      return this.tree[node]
    }

    // 部分重叠，需要分别查询左右子树
    const mid = Math.floor((start + end) / 2)
    const leftSum = this._query(2 * node, start, mid, left, right)
    const rightSum = this._query(2 * node + 1, mid + 1, end, left, right)
    return leftSum + rightSum
  }

  /**
   * 单点更新
   * @param {number} index - 要更新的数组索引
   * @param {number} value - 新值
   */
  update(index, value) {
    this._update(1, 0, this.n - 1, index, value)
  }

  _update(node, start, end, index, value) {
    if (start === end) {
      // 叶子节点，直接更新
      this.tree[node] = value
    } else {
      const mid = Math.floor((start + end) / 2)
      if (index <= mid) {
        this._update(2 * node, start, mid, index, value)
      } else {
        this._update(2 * node + 1, mid + 1, end, index, value)
      }
      // 更新当前节点的值
      this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1]
    }
  }
}

// 使用示例
const array = [1, 3, 5, 7]
const segTree = new SegmentTree(array)

console.log('原数组:', array)
console.log('区间 [1, 2] 的和:', segTree.query(1, 2)) // 3 + 5 = 8
console.log('区间 [0, 3] 的和:', segTree.query(0, 3)) // 1 + 3 + 5 + 7 = 16

// 单点更新
segTree.update(1, 10) // 将索引 1 的值从 3 更新为 10
console.log('更新后区间 [1, 2] 的和:', segTree.query(1, 2)) // 10 + 5 = 15

