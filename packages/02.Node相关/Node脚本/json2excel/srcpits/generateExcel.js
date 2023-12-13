/* eslint-disable import/no-extraneous-dependencies */
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

// 创建一个数组来存储所有的行
const rows = []
const allData = {}
// 文件目录路径
const folderPath = path.join(__dirname, '../output')

// 读取文件目录下的所有json文件
fs.readdirSync(folderPath).forEach(file => {
  if(path.extname(file) === '.json') {
    // 读取json文件
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../output', file), 'utf8'))
    allData[path.basename(file)] = data
  }
})

const allDataKeys = Reflect.ownKeys(allData)
// 第一个对象
const firstData = allData[dataKeys[0]]
// 遍历第一个对象的所有键
Reflect.ownKeys(firstData).forEach((key) => {
    // 创建一个新的对象来存储这一行的数据
    const row = { key }
    // 遍历所有数据对象，将每个数据对象中相同key的值添加到row中
    allDataKeys.forEach(item => {
      row[item] = allData[item][key]
    })
    // 将这一行添加到数组中
    rows.push(row)
})

// 使用xlsx库将数据写入Excel文件
const ws = XLSX.utils.json_to_sheet(rows)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
XLSX.writeFile(wb, path.join(__dirname, '../output', 'output.xlsx'))
