import { initializeApp } from 'firebase/app'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { getAnalytics, logEvent } from 'firebase/analytics'
import defaultTemplate from '../hbs/partials/freight.hbs'

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY
const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID
const FIREBASE_REGION = process.env.FIREBASE_REGION
const FIREBASE_LOCAL_HOST = process.env.FIREBASE_LOCAL_HOST
const FIREBASE_FIRESTORE_EMULATOR_PORT = process.env.FIREBASE_FIRESTORE_EMULATOR_PORT
const ESTABLISHMENT_ID = process.env.ESTABLISHMENT_ID

const app = initializeApp({
  projectId: FIREBASE_PROJECT_ID,
  apiKey: FIREBASE_API_KEY,
  appId: FIREBASE_APP_ID
})
const functions = getFunctions(app, FIREBASE_REGION)
const getZIPData = httpsCallable(functions, 'getZIPData')
const analytics = getAnalytics()

if (FIREBASE_LOCAL_HOST && FIREBASE_FIRESTORE_EMULATOR_PORT) {
  console.log('Connected to local Functions')
  connectFunctionsEmulator(functions, FIREBASE_LOCAL_HOST, +FIREBASE_FIRESTORE_EMULATOR_PORT)
}

export default {
  activate
}

let _template
export function activate (template) {
  _template = template ?? defaultTemplate
  const el = document.querySelector('#cep')
  el.addEventListener('keyup', handleInputChange)
  el.addEventListener('paste', handleInputChange)

  handleInputChange({ target: el })
}

function setContainerChildren (rows, loading) {
  const container = document.querySelector('.frete-container')
  container.classList.remove('frete-container--empty')
  container.classList.remove('frete-container--loading')
  container.classList.remove('frete-container--loaded')
  container.classList.add(
    rows !== undefined
      ? 'frete-container--loaded'
      : loading
        ? 'frete-container--loading'
        : 'frete-container--empty'
  )

  const output = document.querySelector('.frete-output')
  output.innerHTML = rows === undefined
    ? ''
    : rows.map(_template).join('')
  output.style.display = rows === undefined
    ? 'none'
    : 'block'

  document.querySelector('.loading').style.display = loading
    ? 'block'
    : 'none'
}

const cache = {}
let eventLogged = false
async function handleInputChange (e) {
  e.target.value = e.target.value.replace(/[^\d]+/, '').substr(0, 8)
  const cep = e.target.value
  setContainerChildren(undefined, false)
  if (cep.length === 8) {
    if (cache[cep] === undefined) {
      setContainerChildren(undefined, true)
      cache[cep] = getZIPData({ zip: e.target.value, establishmentId: ESTABLISHMENT_ID })
    }
    try {
      const result = await cache[cep]
      const { data } = result.data
      const rows = data.freights.map(row => ({ ...row, price: 'R$ ' + row.price.toFixed(2).replace('.', ',') }))
      setContainerChildren(rows, false)
      if (!eventLogged) {
        eventLogged = true
        logEvent(analytics, 'lp_load_zip_code', { cep })
      }
    } catch (err) {
      setContainerChildren(undefined, false)
    }
  }
}
