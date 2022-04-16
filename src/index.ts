#!/usr/bin/env node
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const argv = await yargs(hideBin(process.argv))
  .usage('Usage: $0 [command] [options]')
  .command('download-data', 'download data for a specific establishment', {
    path: { type: 'string', describe: 'Path to save the data file' },
    establishmentId: { type: 'string', describe: 'Establishment id' }
  })
  .command('get-hbs-partials-dir', 'install hbs partials dir in the specified folder', {
    dir: { type: 'string', describe: 'Path to the dir to save the handlebars partials files' }
  })
  .command('get-js-dir', 'install js dir in the specified folder', {
    dir: { type: 'string', describe: 'Path to the dir to save the js files' }
  })
  .argv
const command = argv._[0]
const { PROJECT_ID, MEASUREMENT_ID } = process.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log(`------- starting box6utils with -------`)
console.log(`:: ENVIRONMENTAL VARIABLES ::`)
console.log(`PROJECT_ID: `, PROJECT_ID)
console.log(`MEASUREMENT_ID: `, MEASUREMENT_ID)
console.log(``)
console.log(`:: ARGUMENTS ::`)
console.log(`command: `, command)
for (const [key, value] of Object.entries(argv)) {
  console.log(`--${key}: `, value)
}
console.log(`--------------------------------------`)
console.log(``)

if (!PROJECT_ID) {
  console.error(`projectId must be informed as an environmental variable!`)
  process.exit(1)
} else if (!MEASUREMENT_ID) {
  console.error(`measurementId must be informed as an environmental variable!`)
  process.exit(2)
} else {
  switch (command) {
    case 'download-data': await downloadData(argv.path as string, argv.establishmentId as string)
    case 'get-hbs-partials-dir': await getHbsPartialsDir(argv.dir as string)
    case 'get-js-dir': await getJsDir(argv.dir as string)
    default: {
      console.error(`Command implementation not found!`)
      process.exit(3)
    }
  }
}

async function downloadData(path0: string, establishmentId: string) {
  const app = initializeApp({ projectId: PROJECT_ID })

  const db = getFirestore(app)

  const ref = doc(db, 'establishments', establishmentId)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    console.error(`firestore document /establishments/${establishmentId} not found!`)
    process.exit(23)
  } else {
    const { plans } = snapshot.data()
    const pricing = Object.entries<any>(plans).reduce<any>((acc, [key, value]) => [...acc, {
      ...value,
      code: key,
      actionText: 'ASSINE JÁ',
      isHotPage: true,
      isSelected: false,
      isEdit: false
    }], []).sort((a: any, b: any) => a.order - b.order)

    const data = {
      pricing,
      gaTag: MEASUREMENT_ID,
      builtAt: Number(new Date())
    }
  
    const json = JSON.stringify(data)
    await fs.promises.mkdir(path.dirname(path0), { recursive: true })
    await fs.promises.writeFile(path0, json, 'utf8')
    console.log(`Data file generated successfully!`)
  }
}

async function getHbsPartialsDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })

  const dirPath = `${__dirname}/dist/hbs`
  const files = await fs.promises.readdir(dirPath)
  await Promise.all(files.map(file => fs.promises.copyFile(`${dirPath}/${file}`, path.join(dir, file))))
  console.log(`HBS files copied successfully!`)
}

async function getJsDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })

  const dirPath = `${__dirname}/dist/js`
  const files = await fs.promises.readdir(dirPath)
  await Promise.all(files.map(file => fs.promises.copyFile(`${dirPath}/${file}`, path.join(dir, file))))
  console.log(`JS files copied successfully!`)
}
