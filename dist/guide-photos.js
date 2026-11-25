const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const maxFileSize = 15 * 1024 * 1024
const maxSide = 1600

// Decode and resize in the browser. Only the resulting still image is saved.
export async function prepareGuidePhoto(file) {
  if (!supportedTypes.has(file.type)) throw new Error('Choose a JPEG, PNG, WebP, or GIF image.')
  if (file.size > maxFileSize) throw new Error('Choose an image under 15 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not resize this image.')), 'image/webp', 0.86)
    })
    return { blob, width: canvas.width, height: canvas.height, description: '' }
  } finally {
    bitmap.close()
  }
}

