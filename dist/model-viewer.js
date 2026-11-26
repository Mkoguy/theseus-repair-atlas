import { readMesh } from './mesh-geometry.js'

export function mountModelViewer(container, { picker = true } = {}) {
  container.innerHTML = (picker
    ? '<label class="model-file-picker">Open a 3D file<input type="file" accept=".stl,.obj" aria-describedby="model-file-help"></label>' +
      '<p class="personal-muted" id="model-file-help">STL or OBJ, up to 25 MB. The file stays in this browser.</p>'
    : '') +
    '<p class="model-status" role="status"></p>' +
    '<div class="model-viewport" hidden>' +
    '<canvas tabindex="0" aria-label="3D model. Use arrow keys to rotate, plus and minus to zoom, and Home to reset."></canvas>' +
    '<div class="model-controls" role="group" aria-label="3D view controls">' +
    '<button type="button" class="button button-secondary" data-view-control="left" aria-label="Rotate left">←</button>' +
    '<button type="button" class="button button-secondary" data-view-control="right" aria-label="Rotate right">→</button>' +
    '<button type="button" class="button button-secondary" data-view-control="in" aria-label="Zoom in">+</button>' +
    '<button type="button" class="button button-secondary" data-view-control="out" aria-label="Zoom out">−</button>' +
    '<button type="button" class="button button-secondary" data-view-control="reset">Reset view</button>' +
    '<button type="button" class="button button-secondary" data-view-control="wire" aria-pressed="false">Wireframe</button>' +
    '</div><p class="personal-muted">Drag to rotate. Use the zoom buttons to inspect details.</p></div>'

  const status = container.querySelector('.model-status')
  const viewport = container.querySelector('.model-viewport')
  const canvas = container.querySelector('canvas')
  const context = canvas.getContext('2d')
  const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
  const wireButton = container.querySelector('[data-view-control="wire"]')
  const controlBar = container.querySelector('.model-controls')
  let model
  let yaw = -0.45
  let pitch = -0.35
  let zoom = 1
  let wire = false
  let frame = 0
  let activeLoad = 0
  let pointer
  let lastX
  let lastY

  function draw() {
    frame = 0
    if (!model || !context || !canvas.clientWidth) return
    const ratio = Math.min(devicePixelRatio || 1, 2)
    const width = Math.round(canvas.clientWidth * ratio)
    const height = Math.round(canvas.clientHeight * ratio)
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    context.clearRect(0, 0, width, height)
    const scale = Math.min(width, height) * 0.62 * zoom
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw)
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch)
    const faces = []
    const { preview } = model
    for (let i = 0; i < preview.length; i += 9) {
      const points = []
      let depth = 0
      for (let corner = 0; corner < 9; corner += 3) {
        const x = preview[i + corner], y = preview[i + corner + 1], z = preview[i + corner + 2]
        const a = x * cosYaw + z * sinYaw
        const b = z * cosYaw - x * sinYaw
        const c = y * cosPitch - b * sinPitch
        const d = b * cosPitch + y * sinPitch
        points.push([width / 2 + a * scale, height / 2 - c * scale])
        depth += d
      }
      faces.push({ points, depth })
    }
    if (!wire) faces.sort((a, b) => a.depth - b.depth)
    context.lineWidth = ratio * 0.7
    context.lineJoin = 'round'
    if (wire) context.beginPath()
    for (const { points: [a, b, c], depth } of faces) {
      if (!wire) context.beginPath()
      context.moveTo(...a)
      context.lineTo(...b)
      context.lineTo(...c)
      context.closePath()
      if (!wire) {
        const lightness = 44 + Math.max(-1.4, Math.min(1.4, depth)) * 12
        context.fillStyle = 'hsl(161 44% ' + lightness + '%)'
        context.fill()
        context.strokeStyle = 'rgba(12, 45, 43, .3)'
        context.stroke()
      }
    }
    if (wire) {
      context.strokeStyle = 'rgba(96, 211, 174, .4)'
      context.stroke()
    }
  }

  function scheduleDraw() {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  function adjust(action) {
    if (action === 'left') yaw -= 0.2
    if (action === 'right') yaw += 0.2
    if (action === 'up') pitch -= 0.2
    if (action === 'down') pitch += 0.2
    if (action === 'in') zoom = Math.min(5, zoom * 1.2)
    if (action === 'out') zoom = Math.max(0.2, zoom / 1.2)
    if (action === 'reset') { yaw = -0.45; pitch = -0.35; zoom = 1 }
    if (action === 'wire') {
      wire = !wire
      wireButton.setAttribute('aria-pressed', String(wire))
    }
    scheduleDraw()
  }

  async function load(file) {
    const token = ++activeLoad
    model = undefined
    viewport.hidden = true
    status.textContent = 'Reading ' + file.name + '…'
    try {
      if (!context) throw new Error('This browser cannot draw the preview.')
      const loaded = await readMesh(file)
      if (token !== activeLoad) return
      model = loaded
      viewport.hidden = false
      const size = model.dimensions.map(value => number.format(value)).join(' × ')
      status.textContent = file.name + ' · ' + number.format(model.triangles) + ' triangles · ' + size +
        ' model units' + (model.simplified ? ' · Simplified preview' : '')
      adjust('reset')
    } catch (error) {
      if (token === activeLoad) status.textContent = error.message || 'Could not open this model.'
    }
  }

  controlBar.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.viewControl
    if (action) adjust(action)
  })
  canvas.addEventListener('keydown', event => {
    const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', Home: 'reset' }[event.key]
    if (!action) return
    event.preventDefault()
    adjust(action)
  })
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== undefined) return
    pointer = event.pointerId
    lastX = event.clientX
    lastY = event.clientY
    canvas.setPointerCapture(pointer)
  })
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return
    yaw += (event.clientX - lastX) * 0.012
    pitch += (event.clientY - lastY) * 0.012
    lastX = event.clientX
    lastY = event.clientY
    scheduleDraw()
  })
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(eventName, event => { if (event.pointerId === pointer) pointer = undefined })
  }
  container.querySelector('input[type="file"]')?.addEventListener('change', event => {
    const file = event.target.files[0]
    event.target.value = ''
    if (file) load(file)
  })
  const observer = new ResizeObserver(scheduleDraw)
  observer.observe(canvas)
  return {
    load,
    destroy() {
      activeLoad++
      cancelAnimationFrame(frame)
      observer.disconnect()
      container.replaceChildren()
    }
  }
}

