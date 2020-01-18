process.on(`uncaughtException`, error => console.error(error))
process.on(`unhandledRejection`, error => console.error(error))

const path = require('path')
const fs = require('fs-extra')
const archiver = require('archiver')

const tempDir = path.join(__dirname, 'build-zip')
const outFile = path.join(__dirname, 'testfront-devtools.zip')

const items = [
  `build`,
  `background.js`,
  `content.js`,
  `devtools.html`,
  `devtools.js`,
  `manifest.json`
]

fs.removeSync(tempDir)
fs.removeSync(outFile)

for (let item of items) {
  fs.copySync(path.join(__dirname, item), path.join(tempDir, item))
}

const outStream = fs.createWriteStream(outFile)
const archive = archiver(`zip`, { zlib: { level: 9 } })

outStream.on(`close`, () => {
  fs.removeSync(tempDir)
})

outStream.on(`end`, () => {
  fs.removeSync(tempDir)
})

archive.on(`warning`, error => {
  if (error.code === 'ENOENT') {
    console.warn(error)
  } else {
    throw error
  }
})

archive.on(`error`, error => {
  throw error
})

archive.pipe(outStream)
archive.directory(tempDir, false)
archive.finalize()
