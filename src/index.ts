#!/usr/bin/env node
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const argv = await yargs(hideBin(process.argv))
  .usage('Usage: $0 <establishment_id> [options]')
  .option('data', {
    demandOption: true,
    describe: 'Path to save the data file',
    type: 'string'
  })
  .option('partials-dir', {
    demandOption: true,
    describe: 'Path to the dir to save the handlebars partials files',
    type: 'string'
  })
  .demandCommand(1, 1, 'You need to provide an establishment id', 'You must provide only a establishment id and nothing else besides options.')
  .demandOption(['data', 'partials-dir'])
  .argv
const establishmentId = `${argv._[0]}`
const dataPath = `${argv.data}`
const partialsDir = `${argv.partialsDir}`
const { projectId, measurementId } = process.env

console.log(`------- starting box6utils with -------`)
console.log(`:: ENVIRONMENTAL VARIABLES ::`)
console.log(`projectId: `, projectId)
console.log(`measurementId: `, measurementId)
console.log(``)
console.log(`:: ARGUMENTS ::`)
console.log(`establishmentId: `, establishmentId)
console.log(`--data: `, dataPath)
console.log(`--partialsDir: `, partialsDir)
console.log(`--------------------------------------`)
console.log(``)

if (!projectId) {
  console.error(`projectId must be informed as an environmental variable!`)
} else if (!measurementId) {
  console.error(`measurementId must be informed as an environmental variable!`)
} else {
  const app = initializeApp({ projectId })

  const db = getFirestore(app)

  const ref = doc(db, 'establishments', establishmentId)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    console.error(`firestore document /establishments/${establishmentId} not found!`)
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
      gaTag: measurementId,
      builtAt: Number(new Date())
    }
  
    const json = JSON.stringify(data)
    await fs.promises.mkdir(path.dirname(dataPath), { recursive: true })
    await fs.promises.writeFile(dataPath, json, 'utf8')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    await fs.promises.mkdir(partialsDir, { recursive: true })
    await Promise.all([
      'freight.hbs',
      'header_gtag.hbs',
      'pricing_section.hbs'
    ].map(file => fs.promises.copyFile(`${__dirname}/../hbs/${file}`, path.join(partialsDir, file))))

    console.log(`Files generated successfully!`)
    process.exit(0)
  }
}
process.exit(1)
