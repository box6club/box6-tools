#!/usr/bin/env node
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import fs from 'fs'
import path from 'path'

const argv = await yargs(hideBin(process.argv))
  .usage('Usage: $0 [command] [options]')
  .command('download-data', 'download data for a specific establishment', {
    path: { type: 'string', demandOption: true, describe: 'Path to save the data file' }
  })
  .argv
const command = argv._[0]
const { FIREBASE_PROJECT_ID, FIREBASE_MEASUREMENT_ID, ESTABLISHMENT_ID } = process.env

const COMMAND_IMPLEMENTATIONS = {
  'download-data': downloadData
}

console.log(`------- starting box6utils with -------`)
console.log(`:: ENVIRONMENTAL VARIABLES ::`)
console.log(`FIREBASE_PROJECT_ID: `, FIREBASE_PROJECT_ID)
console.log(`FIREBASE_MEASUREMENT_ID: `, FIREBASE_MEASUREMENT_ID)
console.log(`ESTABLISHMENTE_ID: `, ESTABLISHMENT_ID)
console.log(``)
console.log(`:: ARGUMENTS ::`)
console.log(`command: `, `'${command}'`)
for (const [key, value] of Object.entries(argv)) {
  console.log(`--${key}: `, value)
}
console.log(`--------------------------------------`)
console.log(``)

if (!FIREBASE_PROJECT_ID) {
  console.error(`projectId must be informed as an environmental variable!`)
  process.exit(1)
} else if (!FIREBASE_MEASUREMENT_ID) {
  console.error(`measurementId must be informed as an environmental variable!`)
  process.exit(2)
} else if (!ESTABLISHMENT_ID) {
  console.error(`establishmentId must be informed as an environmental variable!`)
  process.exit(3)
} else if (!(COMMAND_IMPLEMENTATIONS as any)[command]) {
  console.error(`Command implementation not found!`)
  process.exit(4)
} else {
  const commandImplementation = (COMMAND_IMPLEMENTATIONS as any)[command]
  await commandImplementation(argv)
  process.exit(0)
}

async function downloadData(input: { path: string }) {
  const app = initializeApp({ projectId: FIREBASE_PROJECT_ID })

  const db = getFirestore(app)

  const ref = doc(db, 'establishments', ESTABLISHMENT_ID!)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    console.error(`firestore document /establishments/${ESTABLISHMENT_ID} not found!`)
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
      gaTag: FIREBASE_MEASUREMENT_ID,
      builtAt: Number(new Date())
    }

    const json = JSON.stringify(data)
    await fs.promises.mkdir(path.dirname(input.path), { recursive: true })
    await fs.promises.writeFile(input.path, json, 'utf8')
    console.log(`Data file generated successfully!`)
  }
}
