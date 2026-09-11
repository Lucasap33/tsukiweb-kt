import { extractEntry, parseEntries } from '@tsukiweb/common/tools/extract-nsa/core.js'
import { readImportedImages, saveImportedImages } from './imported-images-db'

const IMAGE_IDS = new Set(Array.from({ length: 9 }, (_, i) => `event/ren_h0${i + 1}`))
export const importedImages = { urls: {} as Record<string, string> }
const retiredUrls: string[] = []

function replaceUrls(urls: Record<string, string>) {
  retiredUrls.push(...Object.values(importedImages.urls))
  importedImages.urls = urls
}

// Called after React has replaced the displayed URLs.
export function releaseImportedImageUrls() {
  retiredUrls.forEach(url => URL.revokeObjectURL(url))
  retiredUrls.length = 0
}

export async function loadImportedImages() {
  const urls: Record<string, string> = {}
  try {
    const images = await readImportedImages()
    for (const [id, blob] of Object.entries(images)) urls[id] = URL.createObjectURL(blob)
    replaceUrls(urls)
  } catch (error) {
    Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    console.error('Could not load imported images.', error)
  }
}

function extractLenImages(buffer: Uint8Array): Record<string, Blob> {
  const images: Record<string, Blob> = {}
  for (const entry of parseEntries(buffer)) {
    const filename = entry.filename.replaceAll('\\', '/').toLowerCase()
    const id = filename.match(/^image\/(.+)\.[^/.]+$/)?.[1]
    if (!id || !IMAGE_IDS.has(id)) continue
    images[id] = new Blob([new Uint8Array(extractEntry(buffer, entry))])
  }
  if (Object.keys(images).length !== IMAGE_IDS.size) throw new Error('Missing required images.')
  return images
}

export async function importLenImages(file: File) {
  const images = extractLenImages(new Uint8Array(await file.arrayBuffer()))
  const urls: Record<string, string> = {}
  try {
    for (const [id, blob] of Object.entries(images)) {
      const image = new Image()
      image.src = urls[id] = URL.createObjectURL(blob)
      await image.decode()
    }
    await saveImportedImages(images)
  } catch (error) {
    Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    throw error
  }
  replaceUrls(urls)
}

export async function eraseLenImages() {
  await saveImportedImages({})
  replaceUrls({})
}
