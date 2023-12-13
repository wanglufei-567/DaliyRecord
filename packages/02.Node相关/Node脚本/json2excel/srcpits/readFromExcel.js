/* eslint-disable import/no-extraneous-dependencies */
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

// 读取Excel文件
const workbook = XLSX.readFile(path.join(__dirname, 'input.xlsx'))
const worksheet = workbook.Sheets[workbook.SheetNames[0]]

// 将工作表转换为JSON数组
const data = XLSX.utils.sheet_to_json(worksheet)

// 创建一个空对象来存储结果
const result = {}

// 遍历数据
data.forEach((row) => {
    // 遍历每一行的所有属性
    Reflect.ownKeys(row).forEach((key) => {
        if (key !== 'key') {
            // 如果结果对象中还没有这个属性，就创建一个空对象
            if (!result[key]) {
                result[key] = {}
            }
            // 将这个属性的值添加到结果对象中
            result[key][row.key] = row[key]
        }
    })
})

// 遍历结果对象，将每个属性的值写入一个JSON文件
Reflect.ownKeys(result).forEach((key) => fs.writeFileSync(path.join(__dirname, 'assets', `${key}.json`), JSON.stringify(result[key], null, 2)))
