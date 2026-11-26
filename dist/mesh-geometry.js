const MAX_BYTES = 25 * 1024 * 1024
const MAX_TRIANGLES = 500_000
const PREVIEW_TRIANGLES = 14_000
const decoder = new TextDecoder()

function addTriangle(vertices, a, b, c) {
  if (vertices.length >= MAX_TRIANGLES * 9) throw new Error('This model exceeds the 500,000 triangle limit.')
  vertices.push(...a, ...b, ...c)
}

function parseStl(buffer) {
  const bytes = new DataView(buffer)
  const count = buffer.byteLength >= 84 ? bytes.getUint32(80, true) : 0
  if (count && 84 + count * 50 === buffer.byteLength) {
    if (count > MAX_TRIANGLES) throw new Error('This model exceeds the 500,000 triangle limit.')
    const vertices = new Float32Array(count * 9)
    for (let face = 0; face < count; face++) {
      const offset = 84 + face * 50 + 12
      for (let axis = 0; axis < 9; axis++) vertices[face * 9 + axis] = bytes.getFloat32(offset + 4 * axis, true)
    }
    return vertices
  }

  const vertices = []
  let triangle = []
  for (const match of decoder.decode(buffer).matchAll(/^\s*vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gmi)) {
    triangle.push(match.slice(1).map(Number))
    if (triangle.length === 3) {
      addTriangle(vertices, ...triangle)
      triangle = []
    }
  }
  if (triangle.length) throw new Error('An STL triangle is incomplete.')
  return vertices
}

function parseObj(buffer) {
  const vertices = []
  const faces = []
  const text = decoder.decode(buffer).replace(/\\\r?\n/g, ' ')
  for (const line of text.split(/\r?\n/)) {
    const [kind, ...values] = line.split('#', 1)[0].trim().split(/\s+/)
    if (kind === 'v') {
      if (values.length < 3) throw new Error('An OBJ vertex is missing coordinates.')
      vertices.push(values.slice(0, 3).map(Number))
    }
    if (kind === 'f') {
      if (values.length < 3) throw new Error('An OBJ face needs at least three vertices.')
      const polygon = values.map(value => {
        const index = Number(value.split('/')[0])
        return Number.isInteger(index) && index ? vertices[index > 0 ? index - 1 : vertices.length + index] : undefined
      })
      if (polygon.some(vertex => !vertex)) throw new Error('An OBJ face references a missing vertex.')
      for (let i = 1; i < polygon.length - 1; i++) addTriangle(faces, polygon[0], polygon[i], polygon[i + 1])
    }
  }
  return faces
}

// STL has an ASCII and a binary variant. OBJ previews use geometry only.
export async function readMesh(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  if (extension !== 'stl' && extension !== 'obj') throw new Error('Choose an STL or OBJ file.')
  if (file.size > MAX_BYTES) throw new Error('Choose a model that is 25 MB or smaller.')
  const buffer = await file.arrayBuffer()
  const vertices = extension === 'stl' ? parseStl(buffer) : parseObj(buffer)
  if (!vertices.length) throw new Error('No 3D faces were found in this file.')

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < vertices.length; i++) {
    const axis = i % 3
    const value = vertices[i]
    if (!Number.isFinite(value)) throw new Error('This model contains invalid coordinates.')
    min[axis] = Math.min(min[axis], value)
    max[axis] = Math.max(max[axis], value)
  }
  const dimensions = max.map((value, axis) => value - min[axis])
  const span = Math.max(...dimensions)
  if (!Number.isFinite(span) || !span) throw new Error('This model has no usable size.')
  const center = min.map((value, axis) => value + dimensions[axis] / 2)
  const triangles = vertices.length / 9
  const stride = Math.ceil(triangles / PREVIEW_TRIANGLES)
  const preview = new Float32Array(Math.ceil(triangles / stride) * 9)
  let target = 0
  for (let face = 0; face < triangles; face += stride) {
    for (let i = 0; i < 9; i++) preview[target++] = (vertices[face * 9 + i] - center[i % 3]) / span
  }
  return { preview, triangles, dimensions, simplified: stride > 1 }
}

