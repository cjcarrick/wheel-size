import { existsSync, promises } from 'fs'
import path from 'path'
import process from 'process'

//
// src
// └── examples
//     └── <car-name>.json
//
// will be translated into:
//
// dist
// └── examples
//      ├── index.json
//      └── <car-name>
//          └── <width>
//              └── <offset>.json
//
// ...so that data can be easily fetched, even from static hosting services like
// GitHub Pages, and you don't need a database that can query things
//
// index.json contains metadata on everything else in the thing
//

const srcDir = path.join(process.cwd(), 'src', 'examples')
const distDir = path.join(process.cwd(), 'dist', 'examples')
const files = await promises.readdir(srcDir)

// Clear any old files
if (existsSync(distDir))
  await promises.rm(distDir, {
    recursive: true
  })

function objectsAreTheSame(a, b) {

  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }

  for (let i = 0; i < Object.keys(a).length; i++) {
    const k = Object.keys(a)[i]

    if (!(k in b)) {
      return false
    }

    if (
      typeof a[k] == 'object' &&
      a[k] !== null &&
      typeof b[k] == 'object' &&
      b[k] !== null
    ) {
      return objectsAreTheSame(a[k], b[k])
    }

    if (a[k] !== b[k]) {
      return false
    }
  }

  return true
}

// This will be added to as we find more data
const index = {}

for (let i = 0; i < files.length; i++) {
  const file = files[i]

  // Skip over non-json files
  if (!file.endsWith('.json')) continue

  const fileLocation = path.join(srcDir, file)
  const car = file.replace(/\.json$/, '')

  const grouped = {}

  function addToGroup(width, offset, item) {
    if (!(car in index)) {
      index[car] = {}
    }

    if (!(width in grouped)) {
      index[car][width] = []
      grouped[width] = {}
    }

    if (!(offset in grouped[width])) {
      index[car][width].push(offset)
      grouped[width][offset] = []
    }

    grouped[width][offset].push(item)
  }

  const dat = JSON.parse(await promises.readFile(fileLocation, 'utf8'))

  for (let j = 0; j < dat.length; j++) {
    const example = dat[j]

    // Handle staggered and square setups
    if ('front' in example.wheel) {
      addToGroup(example.wheel.back.width, example.wheel.back.offset, example)

      const same = objectsAreTheSame(example.wheel.front, example.wheel.back)
      // Prevent duplicates
      if (!same) {
        addToGroup(
          example.wheel.front.width,
          example.wheel.front.offset,
          example
        )
      }
    } else {
      addToGroup(example.wheel.width, example.wheel.offset, example)
    }
  }

  for (let j = 0; j < Object.keys(grouped).length; j++) {
    const width = Object.keys(grouped)[j]
    const carsWithThisWidth = grouped[width]

    for (let k = 0; k < Object.keys(carsWithThisWidth).length; k++) {
      const offset = Object.keys(carsWithThisWidth)[k]
      const carsWithThisOffset = grouped[width][offset]

      const location = path.join(distDir, car, width)
      await promises.mkdir(location, { recursive: true })
      await promises.writeFile(
        path.join(location, offset + '.json'),
        JSON.stringify(carsWithThisOffset),
        'utf8'
      )
    }
  }
}

await promises.writeFile(
  path.join(distDir, 'index.json'),
  JSON.stringify(index, null, 2),
  'utf8'
)
