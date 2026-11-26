import { mountModelViewer } from './model-viewer.js'

export function initPartsTools() {
  mountModelViewer(document.getElementById('standalone-model-viewer'))
  const form = document.getElementById('parts-request-form')
  const draft = document.getElementById('parts-request-draft')
  const message = document.getElementById('parts-request-text')
  const status = document.getElementById('parts-copy-status')
  form.addEventListener('submit', event => {
    event.preventDefault()
    const values = new FormData(form)
    const manufacturer = values.get('manufacturer').trim()
    const model = values.get('model').trim()
    const part = values.get('part').trim()
    if (!manufacturer || !model || !part) return
    const fileRequest = values.has('printable')
      ? '\n\nIf you no longer stock it, do you provide an approved 3D-printable file or a drawing? Please let me know about any material, fit, or safety requirements.'
      : ''
    message.value = 'Subject: Spare part request for ' + model + '\n\n' +
      'Hello ' + manufacturer + ' support,\n\n' +
      'I am repairing a ' + model + ' and am looking for ' + part + '. ' +
      'Could you confirm the compatible part number, availability, and how I can order it?' +
      fileRequest + '\n\nThank you for your help.'
    draft.hidden = false
    status.textContent = ''
    message.focus()
  })
  document.getElementById('copy-parts-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.value)
      status.textContent = 'Draft copied.'
    } catch {
      message.select()
      status.textContent = 'The draft is selected. Use your browser’s copy shortcut.'
    }
  })
}
