const DATABASE = 'kt-imported-images'
const STORE = 'images'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function readImportedImages(): Promise<Record<string, Blob>> {
  const db = await openDatabase()
  try {
    return await new Promise<Record<string, Blob>>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly')
      const store = transaction.objectStore(STORE)
      const keys = store.getAllKeys()
      const values = store.getAll()
      transaction.oncomplete = () => resolve(Object.fromEntries(
        keys.result.map((key, i) => [String(key), values.result[i]])
      ))
      transaction.onabort = () => reject(transaction.error ?? new Error('Image read aborted.'))
    })
  } finally {
    db.close()
  }
}

export async function saveImportedImages(images: Record<string, Blob>): Promise<void> {
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error ?? new Error('Image import aborted.'))
      try {
        const store = transaction.objectStore(STORE)
        store.clear()
        for (const [id, blob] of Object.entries(images)) store.put(blob, id)
      } catch (error) {
        transaction.abort()
        reject(error)
      }
    })
  } finally {
    db.close()
  }
}
