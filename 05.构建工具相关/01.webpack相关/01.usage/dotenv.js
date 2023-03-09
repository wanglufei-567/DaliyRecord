require('dotenv').config()
console.log(process.env.NAME)

const PROD = require('dotenv').config({ path: 'environment/.prod.env' })
console.log(PROD.parsed.NAME)

const DEV = require('dotenv').config({ path: 'environment/.dev.env' })
console.log(DEV.parsed.NAME)