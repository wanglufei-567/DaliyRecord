/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-global-assign */
/* eslint-disable import/no-extraneous-dependencies */

require('ts-node').register()
const fs = require('fs')
const path = require('path')
require = require('esm')(module)

const folderPaths = ['en', 'zh-CN']

// 遍历文件夹读取内容生成json
folderPaths.forEach((folderPath) => {
    let mergedObj = {}
    const _folderPath = path.join(__dirname, '../input', folderPath)

    fs.readdirSync(_folderPath).forEach((file) => {
        // 读取每个文件的默认导出
        const data = require(path.join(_folderPath, file)).default
        // 合并对象
        mergedObj = Object.assign(mergedObj, data)
    })

    // 将合并后的对象转换为JSON字符串
    const jsonStr = JSON.stringify(mergedObj, null, 2) // 使用null和2作为参数可以让JSON字符串更易读

    // 将JSON字符串写入文件
    fs.writeFileSync(path.join(__dirname, '../output', `${folderPath}.json`), jsonStr)
})
