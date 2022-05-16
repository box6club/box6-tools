import { initializeApp } from 'firebase/app'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { getAnalytics, logEvent } from 'firebase/analytics'
import defaultTemplate from '../hbs/partials/freight.hbs'
import { debug } from 'console'

const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  appId: process.env.FIREBASE_APP_ID
})
const functions = getFunctions(app)
const getCEPData = httpsCallable(functions, 'getCEPData')
const analytics = getAnalytics()

if (process.env.FIREBASE_LOCAL_HOST && config.FIREBASE_FIRESTORE_EMULATOR_PORT) {
  debug.log('Connected to local Functions')
  connectFunctionsEmulator(functions, config.FIREBASE_LOCAL_HOST, +config.FIREBASE_FIRESTORE_EMULATOR_PORT)
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
      cache[cep] = getCEPData({ cep: e.target.value })
    }
    try {
      const result = await cache[cep]
      const { data } = result.data
      const rows = data.fretes.map(row => ({ ...row, preco: 'R$ ' + row.preco.toString().replace('.', ',') }))
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
