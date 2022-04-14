#!/usr/bin/env node
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const { apiKey, appId, authDomain, databaseURL, messagingSenderId, projectId, storageBucket } = process.env
const [ _, __, establishmentId ] = process.argv

console.log(` ------- starting box6utils with ------- `)
console.log(`ENVIRONMENTAL VARIABLES:`)
console.log(`apiKey: `, apiKey)
console.log(`appId: `, appId)
console.log(`authDomain: `, authDomain)
console.log(`databaseURL: `, databaseURL)
console.log(`messagingSenderId: `, messagingSenderId)
console.log(`projectId: `, projectId)
console.log(`storageBucket: `, storageBucket)
console.log(``)
console.log(`ARGUMENTS:`)
console.log(`$1 (establishmentId): `, establishmentId)
console.log(` -------------------------------------- `)

if ((establishmentId ?? '').length === 0) {
  process.stdout.write(`missing arguments\n`)
} else {
  const app = initializeApp({
    apiKey,
    appId,
    authDomain,
    databaseURL,
    messagingSenderId,
    projectId,
    storageBucket
  })

  const db = getFirestore(app)

  const ref = doc(db, 'establishments', establishmentId)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    console.error("Establishment document not found!")
  } else {
    const data = snapshot.data()
    console.log('Document data:', data)
    // const plans = Object.entries(data.plans).reduce((acc, [key, value]) => [...acc, {
    //   ...value,
    //   code: key,
    //   actionText: 'ASSINE JÁ',
    //   isHotPage: true,
    //   isSelected: false,
    //   isEdit: false
    // }], []).sort((a, b) => a.order - b.order)
  }
}
