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

// 二叉搜索树的节点
class Node {
  constructor(key) {
    this.key = key
    this.left = null
    this.right = null
  }
}

// 二叉搜索树
class BinarySearchTree {
  constructor(compareFn = defaultCompare) {
    this.compareFn = compareFn // 用来比较节点值
    this.root = null // 根节点
  }

  // 向树中插入一个新的键
  insert(key) {
    if (this.root === null) {
      this.root = new Node(key)
    } else {
      this.insertNode(this.root, key)
    }
  }

  /**
   * @param {Node} node 当前节点
   * @param {any} key 新节点的值
   * 向树中插入一个新的键, 新节点的值会和当前节点的值进行比较，
   * 如果新节点的值小于当前节点的值，则向左子树插入
   * 左子树为空，则直接插入，否则递归调用 insertNode 方法, 继续向左子树插入
   * 如果新节点的值大于当前节点的值，则向右子树插入
   * 右子树为空，则直接插入，否则递归调用 insertNode 方法, 继续向右子树插入
   */
  insertNode(node, key) {
    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      // 如果新节点的值小于当前节点的值，则向左子树插入
      if (node.left === null) {
        node.left = new Node(key)
      } else {
        // 如果左子树不为空，则递归调用 insertNode 方法, 继续向左子树插入
        this.insertNode(node.left, key)
      }
    } else {
      // 如果新节点的值大于当前节点的值，则向右子树插入
      if (node.right === null) {
        node.right = new Node(key)
      } else {
        // 如果右子树不为空，则递归调用 insertNode 方法, 继续向右子树插入
        this.insertNode(node.right, key)
      }
    }
  }

  // ———————————————— 前序、中序、后序遍历 ————————————————

  // 前序、中序和后序遍历都属于「深度优先」遍历，也称「深度优先搜索」（DFS），它体现了一种「先走到尽头，再回溯继续」的遍历方式
  // 深度优先遍历就像是绕着整棵二叉树的外围“走”一圈，在每个节点都会遇到三个位置，分别对应前序遍历、中序遍历和后序遍历
  // 不同位置执行回调函数，会得到不同的遍历顺序，这也是三种遍历方式的主要区别

  /**
   * 中序遍历是一种以从最小到最大的顺序访问所有节点的遍历方式
   * 中序遍历的一种应用就是对树进行排序操作
   *
   * 中序遍历的顺序：
   * 1. 访问树的左子树
   * 2. 访问根节点
   * 3. 访问树的右子树
   *
   * @param {Function} callback 回调函数，用于处理每个节点的值, 回调函数接收一个参数，即节点的值
   * callback
   */
  inOrderTraverse(callback) {
    this.inOrderTraverseNode(this.root, callback)
  }

  inOrderTraverseNode(node, callback) {
    // 递归算法的「基本情况」是「节点为空」，此时递归调用结束
    if (node !== null) {
      // 递归访问左子树
      this.inOrderTraverseNode(node.left, callback)
      // 访问根节点
      callback(node.key)
      // 递归访问右子树
      this.inOrderTraverseNode(node.right, callback)
    }
  }

  /**
   * 前序遍历的顺序：
   * 1. 访问根节点
   * 2. 访问树的左子树
   * 3. 访问树的右子树
   *
   * @param {Function} callback 回调函数，用于处理每个节点的值, 回调函数接收一个参数，即节点的值
   * callback
   */
  preOrderTraverse(callback) {
    this.preOrderTraverseNode(this.root, callback)
  }

  preOrderTraverseNode(node, callback) {
    if (node !== null) {
      // 访问根节点
      callback(node.key)
      // 递归访问左子树
      this.preOrderTraverseNode(node.left, callback)
      // 递归访问右子树
      this.preOrderTraverseNode(node.right, callback)
    }
  }

  /**
   * 后序遍历的顺序：
   * 1. 访问树的左子树
   * 2. 访问树的右子树
   * 3. 访问根节点
   *
   * @param {Function} callback 回调函数，用于处理每个节点的值, 回调函数接收一个参数，即节点的值
   * callback
   */
  postOrderTraverse(callback) {
    this.postOrderTraverseNode(this.root, callback)
  }

  postOrderTraverseNode(node, callback) {
    if (node !== null) {
      // 递归访问左子树
      this.postOrderTraverseNode(node.left, callback)
      // 递归访问右子树
      this.postOrderTraverseNode(node.right, callback)
      // 访问根节点
      callback(node.key)
    }
  }

  // ———————————————— 层序遍历 ————————————————

  // 层序遍历是一种以从上到下、从左到右的顺序访问所有节点的遍历方式
  // 层序遍历属于「广度优先」遍历，也称「广度优先搜索」（BFS），它体现了一种「逐层推进」的遍历方式
  // 层序遍历的顺序：
  // 1. 访问根节点
  // 2. 访问树的左子树
  // 3. 访问树的右子树
  // 4. 访问树的左子树的左子树
  // 5. 访问树的左子树的右子树
  // 6. 访问树的右子树的左子树
  // 7. 访问树的右子树的右子树

  /**
   * 层序遍历
   *
   * @param {Function} callback 回调函数，用于处理每个节点的值, 回调函数接收一个参数，即节点的值
   * callback
   */
  levelOrderTraverse(callback) {
    this.levelOrderTraverseNode(this.root, callback)
  }

  levelOrderTraverseNode(node, callback) {
    if (node !== null) {
      // 初始化一个队列
      const queue = [node]
      // 初始化一个列表，用于保存遍历序列
      const list = []
      let depth = 0 // 当前层级
      while (queue.length > 0) {
        // 从队列中取出一个节点
        const current = queue.shift()
        // 保存节点值
        list.push(current.key)
        // 执行回调函数
        callback(current.key, depth)
        // 如果当前节点有左子树，则将左子树加入队列
        if (current.left !== null) {
          queue.push(current.left)
        }
        // 如果当前节点有右子树，则将右子树加入队列
        if (current.right !== null) {
          queue.push(current.right)
        }
        depth++
      }
      return list
    } else {
      return 'The tree is empty'
    }
  }

  // ———————————————— 搜索树中的值 ————————————————

  // 搜索树中最常用的操作之一就是搜索树中的最小值和最大值
  // 在二叉搜索树中，最小值在树的最左边，最大值在树的最右边
  // 因此，搜索树中的最小值和最大值的搜索方式非常相似

  // 搜索树中的最小值
  min() {
    return this.minNode(this.root)
  }

  minNode(node) {
    let current = node
    while (current !== null && current.left !== null) {
      current = current.left
    }
    return current
  }

  // 搜索树中的最大值
  max() {
    return this.maxNode(this.root)
  }

  maxNode(node) {
    let current = node
    while (current !== null && current.right !== null) {
      current = current.right
    }
    return current
  }

  /**
   * 搜索树中的值
   *
   * @param {any} key 要搜索的值
   * @returns {boolean} 如果找到该值，则返回 true，否则返回 false
   */
  search(key) {
    return this.searchNode(this.root, key)
  }

  searchNode(node, key) {
    if (node === null) {
      return false
    }
    // 如果当前节点的值大于要搜索的值，则向左子树搜索
    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      return this.searchNode(node.left, key)
    }
    // 如果当前节点的值小于要搜索的值，则向右子树搜索
    if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
      return this.searchNode(node.right, key)
    }
  }

  /**
   * 删除树中的一个值
   *
   * @param {any} key 要删除的值
   */
  remove(key) {
    this.root = this.removeNode(this.root, key)
  }

  /**
   * 删除树中的一个值
   *
   * @param {Node} node 当前节点
   * @param {any} key 要删除的值
   * @returns {Node} 返回删除后的树
   */
  removeNode(node, key) {
    if (node === null) {
      return null
    }

    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      // 如果当前节点的值大于要删除的值，则向左子树搜索
      node.left = this.removeNode(node.left, key)
      return node
    } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
      // 如果当前节点的值小于要删除的值，则向右子树搜索
      node.right = this.removeNode(node.right, key)
      return node
    } else {
      // 如果当前节点的值等于要搜索的值，则删除该节点
      if (node.left === null && node.right === null) {
        node = null
        return node
      }

      if (node.left === null) {
        // 如果当前节点的左子树为空，则将当前节点的右子树赋值给当前节点，从而删除当前节点
        node = node.right
        return node
      } else if (node.right === null) {
        // 如果当前节点的右子树为空，则将当前节点的左子树赋值给当前节点，从而删除当前节点
        node = node.left
        return node
      }

      // 如果当前节点的左右子树都不为空，则将当前节点的右子树的最小值赋值给当前节点
      // 1. 找到当前节点的右子树的最小值
      const aux = this.minNode(node.right)
      // 2. 将当前节点的右子树的最小值赋值给当前节点
      node.key = aux.key
      // 3. 删除当前节点的右子树的最小值
      node.right = this.removeNode(node.right, aux.key)
      // 4. 返回当前节点
      return node
    }
  }
}
