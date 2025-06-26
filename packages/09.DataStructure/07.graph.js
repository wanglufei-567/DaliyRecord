/**
 * 图（Graph）
 * 定义：
 * 图（Graph）是一种复杂的非线性数据结构，由顶点（Vertex）和边（Edge）组成
 * 用于表示对象之间的多对多关系，是现实世界中复杂关系的抽象表示
 *
 * 基本组成：
 * - 顶点（Vertex/Node）：图中的基本单元，表示实体对象
 * - 边（Edge）：连接两个顶点的线，表示顶点之间的关系
 *
 * 图的表示方法：
 * 1. 邻接矩阵：使用二维数组表示，matrix[i][j] 表示顶点 i 到顶点 j 的关系
 * 2. 邻接表：使用数组+链表/数组表示，每个顶点维护一个相邻顶点列表
 *
 * 常见算法：
 * - 遍历：深度优先搜索（DFS）、广度优先搜索（BFS）
 * - 最短路径：Dijkstra算法、Floyd算法
 * - 最小生成树：Prim算法、Kruskal算法
 * - 拓扑排序：用于有向无环图的排序
 *
 * 时间复杂度（V为顶点数，E为边数）：
 * - 邻接矩阵：查找O(1)，遍历O(V²)，空间O(V²)
 * - 邻接表：查找O(V)，遍历O(V+E)，空间O(V+E)
 */

/**
 * 图的实现
 */
class Graph {
  constructor(isDirected = false) {
    this.isDirected = isDirected // 是否为有向图
    this.vertices = [] // 顶点列表
    this.adjList = new Map() // 邻接表
  }

  /**
   * 添加顶点
   * @param {string} vertex 顶点
   */
  addVertex(vertex) {
    // 如果顶点不存在，则添加顶点
    if (!this.vertices.includes(vertex)) {
      // 添加顶点
      this.vertices.push(vertex)
      // 添加邻接表
      this.adjList.set(vertex, [])
    }
  }

  /**
   * 添加边
   * @param {string} vertex1 顶点1
   * @param {string} vertex2 顶点2
   * 两个顶点之间建立连接，创建一条边
   */
  addEdge(vertex1, vertex2) {
    // 如果顶点不存在，则添加顶点
    if (!this.adjList.has(vertex1)) {
      this.addVertex(vertex1)
    }
    // 如果顶点不存在，则添加顶点
    if (!this.adjList.has(vertex2)) {
      this.addVertex(vertex2)
    }
    // 添加边
    this.adjList.get(vertex1).push(vertex2)
    // 如果是无向图，则添加反向边
    if (!this.isDirected) {
      this.adjList.get(vertex2).push(vertex1)
    }
  }

  /**
   * 获取邻接表
   * @returns {string[]} 邻接表
   */
  getAdjList() {
    return this.adjList
  }

  /**
   * 获取顶点
   * @returns {string[]} 顶点
   */
  getVertices() {
    return this.vertices
  }

  /**
   * 获取图的字符串表示
   * @returns {string} 图的字符串表示
   */
  toString() {
    let s = ''
    for (let i = 0; i < this.vertices.length; i++) {
      s += `${this.vertices[i]} -> ${this.adjList.get(this.vertices[i]).join(' ')}\n`
    }
    return s
  }
}

// 使用示例
const graph = new Graph()
const myVertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
for (let i = 0; i < myVertices.length; i++) {
  graph.addVertex(myVertices[i])
}
graph.addEdge('A', 'B')
graph.addEdge('A', 'C')
graph.addEdge('A', 'D')
graph.addEdge('C', 'D')
graph.addEdge('C', 'G')
graph.addEdge('D', 'G')
graph.addEdge('D', 'H')
graph.addEdge('B', 'E')
graph.addEdge('B', 'F')
graph.addEdge('E', 'I')
console.log(graph.toString())

/**
 * 输出结果：
 * A -> B C D
 * B -> A E F
 * C -> A D G
 * D -> A C G H
 * E -> B I
 * F -> B
 * G -> C D
 * H -> D
 * I -> E
 *
 *
 * 图数据结构示意图：
 *         A ────────── B ────────── E ────────── I
 *         │╲           │
 *         │ ╲          │
 *         │  ╲         F
 *         │   ╲
 *         C────D────────H
 *         │   ╱
 *         │  ╱
 *         │ ╱
 *         G╱
 *
 * 图的特征分析：
 * - 顶点数量：9 个 (A, B, C, D, E, F, G, H, I)
 * - 边数量：11 条边
 * - 图类型：无向连通图
 * - 最高度数顶点：D (度数为 4)
 * - 叶子节点：F、H、I (度数为 1)
 * - 中心节点：A 和 D 是连接度较高的核心节点
 */

// =================== 图的遍历 =============================

/**
 * 和 树 数据结构类似，图的遍历也有两种方式：
 * 1. 广度优先搜索（BFS）：从起点开始，逐层遍历所有顶点
 * 2. 深度优先搜索（DFS）：从起点开始，沿着一条路径一直走到底，然后回溯
 *
 * 图遍历可以用来寻找特定顶点或寻找两个顶点之间的路径，检查图是否连通，检查图是否含有环，或寻找最短路径等
 *
 * 图遍历算法的思想：必须追踪每个第一次访问的顶点，并且追踪还有哪些顶点还没有被完全探索
 *
 * 完全探索一个顶点要求我们查看该顶点的每一条边，
 * 对于每一条边所连接的没有被访问过的顶点，将其标注为待访问的，并将其加进待访问顶点列表中
 *
 * 对于图遍历两种算法，都需要明确指出第一个被访问的顶点
 * 两种算法都需要一个辅助列表来保存被访问过的顶点
 *
 * 广度优先搜索和深度优先搜索二者在算法上基本相同，只有一点不同，那就是待访问顶点列表的数据结构不同
 * - 广度优先搜索使用队列：将顶点加入队列中，最先加入的顶点最先被探索
 * - 而深度优先搜索使用栈：将顶点压入栈中，顶点是沿着路径被探索的，存在新的相邻顶点就去访问
 */

/**
 * 颜色常量
 * 用于标注已经被访问过的顶点的状态
 *
 * 白色：未访问
 * 灰色：被访问过，但未探索过
 * 黑色：被访问过且被探索过
 *
 * 为什么需要三种状态？
 *
 * 在图的遍历算法中，需要区分顶点的不同访问状态，以避免无限循环和重复访问：
 *
 * 1. 白色（WHITE）- 未访问状态
 *    - 表示顶点尚未被发现，还没有加入到待处理队列/栈中
 *    - 初始时所有顶点都是白色状态
 *    - 用于判断一个顶点是否需要被加入到遍历队列中
 *
 * 2. 灰色（GREY）- 已发现但未处理完成
 *    - 表示顶点已被发现并加入队列/栈，但其邻接顶点还没有全部被探索
 *    - 在 BFS 中：顶点在队列中等待处理时为灰色
 *    - 在 DFS 中：顶点正在被处理（递归调用中）时为灰色
 *    - 关键作用：防止重复将同一顶点加入队列，避免无限循环
 *
 * 3. 黑色（BLACK）- 已完全处理
 *    - 表示顶点及其所有邻接顶点都已被探索完成
 *    - 该顶点的处理工作已完全结束
 *    - 用于标记已完成的顶点，在某些算法中用于优化和状态追踪
 *
 * 三色系统的核心优势：
 * - 避免重复访问：通过灰色状态防止顶点被重复加入队列
 * - 检测图的性质：在 DFS 中可用于检测环（灰色顶点指向灰色顶点表示后向边）
 * - 算法正确性：确保每个顶点只被处理一次，保证遍历的完整性
 * - 状态追踪：清晰地表示算法执行过程中每个顶点的处理状态
 */
const Colors = {
  WHITE: 0, // 未访问
  GREY: 1, // 被访问过，但未探索过
  BLACK: 2, // 被访问过且被探索过
}

/**
 * 初始化颜色
 * @param {string[]} vertices 顶点列表
 * @returns {Object} 颜色对象
 * 为每个顶点初始化颜色
 */
const initializeColor = vertices => {
  const color = {}
  for (let i = 0; i < vertices.length; i++) {
    color[vertices[i]] = Colors.WHITE
  }
  return color
}

/**
 * 广度优先搜索
 * @param {Graph} graph 图
 * @param {string} startVertex 起始顶点
 * @param {Function} callback 回调函数
 * 广度优先搜索算法会从指定的起始顶点开始遍历图
 * 先访问起始顶点的所有邻接顶点，就像一次访问图的一层
 * 然后再访问这些邻接顶点的邻接顶点，以此类推，直到所有顶点都被访问过
 *
 * 比如：
 * 从顶点 A 开始，访问 A 的邻接顶点 B、C、D
 * 然后访问 B 的邻接顶点 E、F
 * 然后访问 C 的邻接顶点 G
 * 然后访问 D 的邻接顶点 H
 *
 * 这个算法需要一个辅助队列来存储和访问顶点
 */
const breadthFirstSearch = (graph, startVertex, callback) => {
  // 获取顶点和邻接表
  const vertices = graph.getVertices()
  const adjList = graph.getAdjList()
  // 初始化颜色
  const color = initializeColor(vertices)
  // 创建队列
  const queue = []
  // 将起始顶点加入队列
  queue.push(startVertex)

  // 遍历队列
  while (queue.length > 0) {
    // 从队列中移除第一个顶点
    const u = queue.shift()
    // 获取邻接顶点
    const neighbors = adjList.get(u)
    // 标记为灰色
    color[u] = Colors.GREY
    // 遍历邻接顶点
    for (let i = 0; i < neighbors.length; i++) {
      const w = neighbors[i]
      /**
       * 如果当前邻接顶点颜色为白色，说明未访问过，需要将其加入队列，并标记为灰色
       *
       * 如果当前邻接顶点颜色为灰色，说明其不光是当前遍历的顶点的邻接顶点
       * 同样还是之前已经遍历过的顶点的邻接顶点，只是还没有被探索过
       * 这种情况说明图中有环
       *
       * 如果当前邻接顶点颜色为黑色，说明其已经被访问过且被探索过
       * 这种同样说明图中有环
       */
      if (color[w] === Colors.WHITE) {
        // 标记为灰色
        color[w] = Colors.GREY
        // 将当前顶点的邻接顶点依次加入队列
        queue.push(w)
      }
    }

    // 这时当前顶点的所有邻接顶点都已经被访问过，可以将当前顶点标记为黑色，表示已经完全探索过
    color[u] = Colors.BLACK
    // 如果回调函数存在，则调用回调函数
    if (callback) {
      callback(u)
    }
  }
}

// 使用示例
const printVertex = value => {
  console.log('Visited vertex: ' + value)
}
breadthFirstSearch(graph, myVertices[0], printVertex)
/**
 * 图数据结构示意图：
 *  A ────────── B ────────── E ────────── I
 *  │╲           │
 *  │ ╲          │
 *  │  ╲         F
 *  │   ╲
 *  C────D────────H
 *  │   ╱
 *  │  ╱
 *  │ ╱
 *  G╱
 *
 * 输出结果：
 * Visited vertex: A
 * Visited vertex: B
 * Visited vertex: C
 * Visited vertex: D
 * Visited vertex: E
 * Visited vertex: F
 * Visited vertex: G
 * Visited vertex: H
 * Visited vertex: I
 *
 * 广度优先搜索（BFS）遍历顺序示意图：
 *
 * 遍历顺序：A(1) → B(2) → C(3) → D(4) → E(5) → F(6) → G(7) → H(8) → I(9)
 *
 * 层级遍历结构：
 *
 * Level 0:    [A]             ← 起始节点
 *              │
 * Level 1:    [B]   [C] [D]   ← A的直接邻接点
 *              │     │   │
 * Level 2:   [E][F] [G] [H]   ← 第二层邻接点
 *             │
 * Level 3:   [I]              ← 第三层邻接点
 *
 * 详细遍历过程：
 *
 * 步骤1: 探索 A (起始)
 *        队列状态: [A] → 访问 A 的邻接顶点: B, C, D
 *        队列更新: [B, C, D]
 *
 * 步骤2: 探索 B (从队列取出)
 *        队列状态: [C, D] → 访问 B 的邻接顶点: E, F
 *        队列更新: [C, D, E, F]
 *
 * 步骤3: 探索 C (从队列取出)
 *        队列状态: [D, E, F] → 访问 C 的邻接顶点: D, G
 *        D 已经访问过了，所以不加入队列
 *        队列更新: [D, E, F, G]
 *
 * 步骤4: 探索 D (从队列取出)
 *        队列状态: [E, F, G] → 访问 D 的邻接顶点: H
 *        队列更新: [E, F, G, H]
 *
 * 步骤5: 探索 E (从队列取出)
 *        队列状态: [F, G, H] → 访问 E 的邻接顶点: I
 *        队列更新: [F, G, H, I]
 *
 * 步骤6: 探索 F (从队列取出)
 *        队列状态: [G, H, I] → 访问 F 的邻接顶点: B
 *        B 已经访问过了，所以不加入队列
 *        队列状态: [G, H, I]
 *
 * 步骤7: 探索 G (从队列取出)
 *        队列状态: [H, I] → 访问 G 的邻接顶点: C, D
 *        C 和 D 已经访问过了，所以不加入队列
 *        队列状态: [H, I]
 *
 * 步骤8: 访问 H (从队列取出)
 *        队列状态: [I] → 访问 H 的邻接顶点: D
 *        D 已经访问过了，所以不加入队列
 *        队列状态: [I]
 *
 * 步骤8: 探索 I (从队列取出)
 *        队列状态: [] → 访问 I 的邻接顶点: E
 *        E 已经访问过了，所以不加入队列
 *        遍历完成
 *
 * BFS 特点总结：
 * - 按层级顺序访问：先访问距离起点1步的所有节点，再访问距离2步的节点
 * - 使用队列实现：保证先发现的节点先被处理（FIFO原则）
 * - 最短路径性质：BFS访问到某个节点时，走的就是从起点到该节点的最短路径
 * - 时间复杂度：O(V + E)，其中V是顶点数，E是边数
 * - 空间复杂度：O(V)，主要用于存储队列和颜色标记
 */

/**
 * 深度优先搜索
 * @param {Graph} graph 图
 * @param {string} startVertex 起始顶点
 * @param {Function} callback 回调函数
 *
 * 深度优先搜索算法会从指定的起始顶点开始遍历图
 * 先访问起始顶点的所有邻接顶点，就像一条路走到黑
 * 然后再访问这些邻接顶点的邻接顶点，以此类推，直到所有顶点都被访问过
 *
 * 比如：
 * 顶点 A 的邻接顶点是 B、C、D，
 * 先访问 B 节点， B 的邻接顶点是 E、F，
 * 然后访问 E 节点， E 的邻接顶点是 I，
 * 然后访问 I 节点，I 节点没有剩余未访问过的邻接顶点，这条路径就算走完了
 * 然后就可以回溯到 E 节点，检查 E 节点是否还有未访问过的邻接顶点
 *
 * 这个算法需要一个辅助栈来存储和访问顶点
 */
const depthFirstSearch = (graph, callback) => {
  // 获取顶点和邻接表
  const vertices = graph.getVertices()
  const adjList = graph.getAdjList()
  // 初始化颜色
  const color = initializeColor(vertices)

  /**
   * 深度优先搜索的辅助函数
   * @param {string} u 当前顶点
   * @param {Object} color 颜色对象
   * @param {Object} adjList 邻接表
   * @param {Function} callback 回调函数
   */
  const depthFirstSearchVisit = (u, color, adjList, callback) => {
    // 标记为灰色
    color[u] = Colors.GREY
    // 如果回调函数存在，则调用回调函数
    if (callback) {
      callback(u)
    }
    // 获取当前顶点的邻接顶点
    const neighbors = adjList.get(u)
    // 遍历当前顶点的邻接顶点
    for (let i = 0; i < neighbors.length; i++) {
      // 获取当前邻接顶点
      const w = neighbors[i]
      // 如果当前邻接顶点颜色为白色，说明未访问过，需要进行深度优先搜索
      if (color[w] === Colors.WHITE) {
        depthFirstSearchVisit(w, color, adjList, callback)
      }
    }
    // 将当前顶点标记为黑色，表示已经完全探索过
    color[u] = Colors.BLACK
  }

  // 遍历所有顶点
  for (let i = 0; i < vertices.length; i++) {
    // 如果顶点颜色为白色，说明未访问过
    if (color[vertices[i]] === Colors.WHITE) {
      depthFirstSearchVisit(vertices[i], color, adjList, callback)
    }
  }
}

// 使用示例
depthFirstSearch(graph, printVertex)
/**
 * 图数据结构示意图：
 *  A ────────── B ────────── E ────────── I
 *  │╲           │
 *  │ ╲          │
 *  │  ╲         F
 *  │   ╲
 *  C────D────────H
 *  │   ╱
 *  │  ╱
 *  │ ╱
 *  G╱
 *
 * 打印结果：
 * Visited vertex: A
 * Visited vertex: B
 * Visited vertex: E
 * Visited vertex: I
 * Visited vertex: F
 * Visited vertex: C
 * Visited vertex: D
 * Visited vertex: G
 * Visited vertex: H
 *
 * 深度优先搜索（DFS）遍历顺序示意图：
 *
 * 遍历顺序：A(1) → B(2) → E(3) → I(4) → F(5) → C(6) → D(7) → G(8) → H(9)
 *
 * 深度优先搜索路径结构：
 *                    A (起始根节点)
 *                    │
 *                    ├─── B (第一个分支)
 *                    │    │
 *                    │    ├─── E (深入探索)
 *                    │    │    │
 *                    │    │    └─── I (叶子节点，到底回溯)
 *                    │    │
 *                    │    └─── F (回溯后的另一个分支，叶子节点)
 *                    │
 *                    └─── C (第二个分支)
 *                         │
 *                         └─── D (继续深入)
 *                              │
 *                              ├─── G (第一个子分支，叶子节点)
 *                              │
 *                              └─── H (第二个子分支，叶子节点)
 *
 * 主要遍历路径分析：
 * 路径1：A → B → E → I （最长深度路径）
 *   特征：一直向前探索，直到遇到叶子节点 I
 *   深度：4 层（A=0, B=1, E=2, I=3）
 *   终止原因：I 的所有邻接点都已被访问（E 已经是灰色状态）
 *   回溯点：从 I 回溯到 E，再回溯到 B
 *
 * 回溯1：I → E → B，然后 B → F （回溯后的新探索）
 *   回溯原因：I 无未访问邻接点，E 无未访问邻接点
 *   新发现：B 还有未访问的邻接点 F
 *   探索结果：F 也是叶子节点，立即回溯
 *
 * 回溯2：F → B → A，然后 A → C （更深层的回溯）
 *   回溯原因：B 的所有邻接点都已处理完毕
 *   新发现：A 还有未访问的邻接点 C
 *   重要性：这是 DFS 的核心特征 - 深度回溯
 *
 * 路径2：A → C → D → G （第二条主要路径）
 *   特征：从根节点的另一个分支开始新的深度探索
 *   深度：4 层（A=0, C=1, D=2, G=3）
 *   终止原因：G 的所有邻接点都已被访问
 *
 * 回溯3：G → D，然后 D → H （局部回溯）
 *   回溯原因：G 无未访问邻接点
 *   新发现：D 还有未访问的邻接点 H
 *   探索结果：H 也是叶子节点，完成最后的探索
 *
 * 邻接点选择规则：
 * 在我们的实现中，DFS 按照邻接表中顶点的存储顺序来选择下一个要访问的顶点：
 *
 * A 的邻接点：[B, C, D] → 选择 B（第一个未访问的）
 * B 的邻接点：[A, E, F] → 跳过 A（已访问），选择 E
 * E 的邻接点：[B, I] → 跳过 B（已访问），选择 I
 * I 的邻接点：[E] → 跳过 E（已访问），无选择，回溯
 * 回到 B：剩余邻接点 [F] → 选择 F
 * F 的邻接点：[B] → 跳过 B（已访问），无选择，回溯
 * 回到 A：剩余邻接点 [C, D] → 选择 C
 * C 的邻接点：[A, D, G] → 跳过 A（已访问），选择 D
 * D 的邻接点：[A, C, G, H] → 跳过 A、C（已访问），选择 G
 * G 的邻接点：[C, D] → 都已访问，回溯
 * 回到 D：剩余邻接点 [H] → 选择 H
 *
 * 路径选择的影响因素：
 * 1. 邻接表的存储顺序：决定了同级选择的优先级
 * 2. 顶点的访问状态：白色顶点优先，灰色/黑色顶点跳过
 * 3. 递归调用栈：决定了回溯的路径和顺序
 *
 * DFS 特点总结：
 * - 深度优先原则：沿着一条路径一直走到底，直到无路可走再回溯
 * - 使用递归实现：利用函数调用栈自然实现了栈的 LIFO（后进先出）特性
 * - 回溯机制：当前路径无法继续时，回溯到上一个节点继续探索其他路径
 *
 * 三色标记系统：
 *   白色：未访问
 *   灰色：正在处理中（在递归调用栈中）
 *   黑色：已完全处理（所有邻接点都已探索）
 *
 * 时间复杂度：O(V + E)，其中 V 是顶点数，E 是边数
 * 空间复杂度：O(V)，主要用于递归调用栈和颜色标记
 * 应用场景：路径查找、环检测、拓扑排序、连通性检测等
 *
 * DFS vs BFS 对比：
 * - DFS：深度优先，使用栈（递归），内存占用相对较小，适合路径搜索
 * - BFS：广度优先，使用队列，能找到最短路径，适合层级遍历
 */
