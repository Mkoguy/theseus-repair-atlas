const LEGACY_KEY = 'theseus:personal-guides'
const DATABASE_NAME = 'theseus-personal-library'
const STORE_NAME = 'guides'

function legacyGuides() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_KEY))
    return Array.isArray(stored) ? stored.filter(guide => typeof guide?.id === 'string') : []
  } catch {
    return []
  }
}

// Import older text guides as part of creating the new store. A failed upgrade
// leaves the original browser data available for a later attempt.
let database
function openDatabase() {
  if (database) return database
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      for (const guide of legacyGuides()) store.put(guide)
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        database = undefined
      }
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  }).catch(error => {
    database = undefined
    throw error
  })
  return database
}

async function run(mode, action) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const request = action(transaction.objectStore(STORE_NAME))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onabort = () => reject(transaction.error || request.error)
  })
}

export const getGuides = () => run('readonly', store => store.getAll())
export const getGuide = id => run('readonly', store => store.get(id))
export const saveGuide = guide => run('readwrite', store => store.put(guide))
export const deleteGuide = id => run('readwrite', store => store.delete(id))

