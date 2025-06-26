/*
将不同树的节点打散平铺开之后，在将其重新组装成完整的树
示例：

不同树的节点混合在一起
const arr = [
    {id: 'b1', parentId: 'a'},
    {id: 'b2', parentId: 'a'},
    {id: 'c1', parentId: 'b1'},
    {id: 'c2', parentId: 'b1'},
    {id: 'bb', parentId: 'aa'},
    {id: 'cc1', parentId: 'bb'},
    {id: 'cc2', parentId: 'bb'}
];

要将其重新组装起来，并以根节点作为 key
const tree = {
  a: [
      {id: 'b1', parentId: 'a'},
      {id: 'b2', parentId: 'a'},
      {id: 'c1', parentId: 'b1'},
      {id: 'c2', parentId: 'b1'},
    ],
  aa: [
      {id: 'bb', parentId: 'aa'},
      {id: 'cc1', parentId: 'bb'},
      {id: 'cc2', parentId: 'bb'}
    ]
}
*/

const arr = [
    { id: 'b1', parentId: 'a' },
    { id: 'b2', parentId: 'a' },
    { id: 'c1', parentId: 'b1' },
    { id: 'c2', parentId: 'b1' },
    { id: 'bb', parentId: 'aa' },
    { id: 'cc1', parentId: 'bb' },
    { id: 'cc2', parentId: 'bb' },
]

// 构建父子关系字典
const buildParentChildMap = arr => {
    const map = {}
    arr.forEach(node => {
        if (!map[node.parentId]) {
            map[node.parentId] = []
        }
        map[node.parentId].push(node)
    })
    return map
}

// 找出所有的根节点
const findRootNodes = arr => {
    const allIds = new Set(arr.map(node => node.id))
    const rootNodes = arr.filter(node => !allIds.has(node.parentId)).map(node => node.parentId)
    return [...new Set(rootNodes)]
}

// 深度遍历，递归地将属于同一棵树的节点提取出来
const extractTreeNodes = (parentChildMap, parentId) => {
    const result = []
    const traverse = parentId => {
        if (parentChildMap[parentId]) {
            parentChildMap[parentId].forEach(node => {
                result.push(node)
                traverse(node.id)
            })
        }
    }
    traverse(parentId)
    return result
}

// 建立一个从 parentId 到子节点列表的映射 map
const parentChildMap = buildParentChildMap(arr)

// 找到所有根节点的 parentId，根节点的 parentId 不是任何一个节点的 id
const rootIds = findRootNodes(arr)

const result = {}
rootIds.forEach(rootId => {
    result[rootId] = extractTreeNodes(parentChildMap, rootId)
})

console.log(result)

/*
解释：
buildParentChildMap 函数遍历数组，建立一个从 parentId 到子节点列表的映射 map

findRootNodes 函数通过比较 parentId 和所有 id 找到根节点的 parentId

extractTreeNodes 函数递归地将属于同一棵树的节点提取出来。首先创建一个空的 result 数组，然后定义一个递归函数 traverse。从根节点开始，找到所有子节点，将其添加到 result 数组中，并继续递归其子节点。

最终，通过遍历 rootIds，使用 extractTreeNodes 提取每棵树的节点，并将其结果存储在 result 对象中。

这样，result 对象的键是每棵树的根节点 id，值是这棵树所有节点的平铺数组，并且没有重复
 */