// 测试数据
const treeData = [
    {
        title: '0-0',
        key: '0-0',
        children: [
            {
                title: '0-0-0',
                key: '0-0-0',
                children: [
                    { title: '0-0-0-0', key: '0-0-0-0' },
                    { title: '0-0-0-1', key: '0-0-0-1' },
                ],
            },
            {
                title: '0-0-1',
                key: '0-0-1',
                children: [{ title: '0-0-1-0', key: '0-0-1-0' }],
            },
        ],
    },
    {
        title: '0-1',
        key: '0-1',
    },
]

/**
 * @description 提取节点 key 的方法
 */
const getAllNodeKeys = (treeData = []) => {
    // 内部变量，用于记录节点 key
    const keys = []
    treeData.forEach(node => {
        keys.push(node.key)
        // 结束条件是 !node.children 即遍历到了叶子节点
        // 基准情况是 直接获取叶子节点的 key 不用再往下遍历了
        if (node.children) {
            keys.push(...getAllNodeKeys(node.children))
        }
    })
    return keys
}

// 匹配函数
const matchFunc = (title, search) => title.match(new RegExp(`^${search}$`, 'i'))

// 一种最简单有效的实现
function findSubTree(treeData, searchValue) {
    let subTree = null
    for (const node of treeData) {
        if (node.title === searchValue) {
            // 基准情况：找到就直接退出，不继续递归了
            return node
        }

        if (node.children) {
            const result = findSubTree(node.children, searchValue)
            if (result) {
                subTree = node
            }
        }
    }
    return subTree
}

const searchValue = '0-0-1'
const subTree = findSubTree(treeData, searchValue)
console.log('subTree', getAllNodeKeys([subTree]))

/**
 * @description 子树提取的方法，根节点到最后一个符合条件的节点之间的子树
 * @param treeNodes 树，嵌套结构
 * @param matchFunc 自定义的匹配方法
 */
function searchTreeNodes1(treeNodes, matchFunc) {
    const fNodes = []
    // 从顶层开始深度遍历节点树
    for (let i = 0; i < treeNodes.length; i += 1) {
        const { children, ...others } = treeNodes[i]

        // 判断当前节点是否满足条件
        const matched = matchFunc(others)

        /*
      若是有子节点，即当前节点不是叶子节点，则进入「递推过程」
      若是没有子节点，即当前节点是叶子节点,则进入「回归过程」
      结束条件：遍历到了叶子节点
     */
        if (children) {
            /*
        这一行是关键，重置了children
        若是叶子节点不符合的话，searchTreeNodes 返回值为空数组，就将其父节点的 children 置空，
        这样若是其父节点也不符合条件的话，父节点的父节点的 children 也会被置空
       */
            others.children = searchTreeNodes(children, matchFunc)
        }

        /*
      当 matched 为 true 时，说明当前节点自己符合条件，记录当前节点
      当 节点有 children 时，说明当前节点的子孙节点中有符合条件的，记录当前节点
    */
        if (matched || (others.children && others.children.length)) {
            fNodes.push({ ...others, matched })
        }
    }
    return fNodes
}

// const childTree = searchTreeNodes(treeData, node => matchFunc(node.title, '0-0-0'));
// console.log('childTreeKeys', getAllNodeKeys(childTree));

/**
 * @description 子树提取的方法，根节点到符合条件的节点之间的子树
 * @param treeNodes 树，嵌套结构
 * @param matchFunc 自定义的匹配方法
 * @param _keepAll 内部变量，用于将符合条件的非叶子节点的子树提取出来
 */
function searchTreeNodes2(treeNodes, matchFunc, _keepAll) {
    const fNodes = []
    // 从顶层开始深度遍历节点树
    for (let i = 0; i < treeNodes.length; i += 1) {
        const { children, ...others } = treeNodes[i]

        // 判断当前节点是否满足条件
        const matched = matchFunc(others)

        /*
      若是有子节点，即当前节点不是叶子节点，则进入「递推过程」
      若是没有子节点，即当前节点是叶子节点,则进入「回归过程」
      结束条件：遍历到了叶子节点
     */
        if (children) {
            /*
        这一行是关键，重置了children
        若是叶子节点不符合的话，searchTreeNodes 返回值为空数组，就将其父节点的 children 置空，
        这样若是其父节点也不符合条件的话，父节点的父节点的 children 也会被置空
       */
            others.children = searchTreeNodes(children, matchFunc, _keepAll || matched)
        }

        /*
      当 _keepAll 为 true 时，说明当前节点的祖先节点中有符合条件的，记录当前节点
      当 matched 为 true 时，说明当前节点自己符合条件，记录当前节点
      当 节点有 children 时，说明当前节点的子孙节点中有符合条件的，记录当前节点
    */
        if (_keepAll || matched || (others.children && others.children.length)) {
            fNodes.push({ ...others, matched })
        }
    }
    return fNodes
}

// const childTree = searchTreeNodes(treeData, node => matchFunc(node.title, '0-0-0'));
// console.log('childTree2Keys', getAllNodeKeys(childTree2));

/**
 * @description 子树提取的方法
 * @param treeNodes 树，嵌套结构
 * @param matchFunc 自定义的匹配方法
 * @param isWholeSubtree 是否提取整颗子树
 * @param _keepAll 内部变量，用于将符合条件的非叶子节点的子树提取出来
 */
function searchTreeNodes(treeNodes, matchFunc, isWholeSubtree, _keepAll) {
    const fNodes = []
    // 从顶层开始深度遍历节点树
    for (let i = 0; i < treeNodes.length; i += 1) {
        const { children, ...others } = treeNodes[i]

        // 判断当前节点是否满足条件
        const matched = matchFunc(others)

        /*
      若是有子节点，即当前节点不是叶子节点，则进入「递推过程」
      若是没有子节点，即当前节点是叶子节点,则进入「回归过程」
      结束条件：遍历到了叶子节点
     */
        if (children) {
            /*
        这一行是关键，重置了children
        若是叶子节点不符合的话，searchTreeNodes 返回值为空数组，就将其父节点的 children 置空，
        这样若是其父节点也不符合条件的话，父节点的父节点的 children 也会被置空
       */
            const __keepAll = isWholeSubtree ? _keepAll || matched : false
            others.children = searchTreeNodes(children, matchFunc, isWholeSubtree, __keepAll)
        }

        /*
      当 _keepAll 为 true 时，说明当前节点的祖先节点中有符合条件的，记录当前节点
      当 matched 为 true 时，说明当前节点自己符合条件，记录当前节点
      当 节点有 children 时，说明当前节点的子孙节点中有符合条件的，记录当前节点
    */
        if (_keepAll || matched || (others.children && others.children.length)) {
            fNodes.push({ ...others, matched })
        }
    }
    return fNodes
}
const childTree = searchTreeNodes(treeData, node => matchFunc(node.title, '0-0-0'), false)
console.log('childTree2Keys', getAllNodeKeys(childTree))
