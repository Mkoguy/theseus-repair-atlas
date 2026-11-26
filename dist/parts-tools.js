import { mountModelViewer } from './model-viewer.js'

const emailPattern = /^[a-z0-9.!#$&'*+\/=_~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i

function buildRequest(contact, model, part, kind) {
  const subject = (kind === 'file' ? '3D file request for ' : 'Spare part request for ') + model
  const partRequest = 'Could you confirm the compatible part number, availability, and how I can order it?'
  const fileRequest = 'Do you provide an approved 3D-printable file or an official download link for this part? Please include any material, fit, and safety requirements.'
  const questions = kind === 'part' ? partRequest : kind === 'file' ? fileRequest
    : partRequest + ' If a spare is unavailable, ' + fileRequest.charAt(0).toLowerCase() + fileRequest.slice(1)
  return {
    subject,
    message: 'Hello ' + contact.name + ' support,\n\n' +
      'I am repairing a ' + model + ' and need help finding ' + part + '.\n\n' +
      questions + '\n\nThank you for your help.'
  }
}

export function initPartsTools() {
  mountModelViewer(document.getElementById('standalone-model-viewer'))
  const $ = id => document.getElementById(id)
  const form = $('parts-request-form')
  const review = $('parts-request-review')
  const subject = $('parts-request-subject')
  const message = $('parts-request-text')
  const copyStatus = $('parts-copy-status')
  const sendStatus = $('parts-send-status')
  const sendButton = $('parts-send-request')
  const approved = review.elements.approved
  const choice = form.elements.contact
  let contacts = new Map()
  let access = { delivery: 'loading' }
  let selected
  let sending = false
  let submitted = false
  let loading = false

  function showContact() {
    const custom = choice.value === 'custom'
    $('parts-custom-contact').hidden = !custom
    for (const field of [form.elements.manufacturer, form.elements.email]) {
      field.required = custom
      field.disabled = !custom
    }
    const contact = contacts.get(choice.value)
    const summary = $('parts-contact-summary')
    const source = $('parts-contact-source')
    summary.hidden = !contact
    source.hidden = !contact?.source
    if (contact) {
      summary.textContent = contact.email
        ? 'Official support email: ' + contact.email
        : 'This manufacturer uses its own support site. Review the request, then open the official support page.'
      source.href = contact.source
    }
    review.hidden = true
  }

  async function open() {
    if (access.delivery !== 'loading' || loading) return
    loading = true
    const status = $('parts-delivery-status')
    try {
      const response = await fetch('/api/parts/status', { cache: 'no-store' })
      if (!response.ok) throw new Error('Status unavailable')
      access = await response.json()
      contacts = new Map(access.contacts.map(contact => [contact.id, contact]))
      for (const contact of contacts.values()) {
        const option = new Option(contact.name, contact.id)
        choice.add(option, choice.querySelector('[value="custom"]'))
      }
      status.textContent = {
        ready: 'Direct email is available for manufacturers with a listed email address.',
        'sign-in': 'Sign in to check access to direct email. You can also use the manufacturer’s contact options.',
        restricted: 'Use your email app or the manufacturer’s support site to send your request.',
        setup: 'Send through your email app or the manufacturer’s support site while direct email is being set up.',
        preview: 'This preview opens official contact routes. Direct sending is available on the hosted site after setup.'
      }[access.delivery] || 'Choose a manufacturer to see its contact options.'
      if (access.signIn) {
        $('parts-sign-in').href = access.signIn
        $('parts-sign-in').hidden = false
      }
    } catch {
      status.textContent = 'The manufacturer directory could not load. Choose Other manufacturer and enter its official support email.'
    } finally {
      loading = false
    }
  }

  function updateReviewActions() {
    if (!selected) return
    const hasMessage = Boolean(subject.value.trim() && message.value.trim())
    const email = $('parts-open-email')
    const support = $('parts-open-support')
    const direct = access.delivery === 'ready' && !!selected.id && !!selected.email
    email.hidden = !selected.email || !hasMessage || sending || submitted
    if (!email.hidden) {
      const recipient = encodeURIComponent(selected.email).replace('%40', '@')
      email.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject.value.trim()) +
        '&body=' + encodeURIComponent(message.value.trim())
      email.classList.toggle('button-primary', !direct)
      email.classList.toggle('button-secondary', direct)
    }
    support.hidden = !selected.source || sending || submitted
    if (!support.hidden) {
      support.href = selected.source
      support.classList.toggle('button-primary', !selected.email)
      support.classList.toggle('button-secondary', !!selected.email)
    }
    $('parts-direct-controls').hidden = !direct || submitted
    $('parts-reply-to').textContent = direct ? 'Replies go to ' + access.replyTo + '.' : ''
    sendButton.disabled = !direct || !hasMessage || !approved.checked || sending || submitted
  }

  choice.addEventListener('change', showContact)
  form.addEventListener('input', () => {
    $('parts-form-status').textContent = ''
    if (!sending) review.hidden = true
  })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (sending) return
    const values = new FormData(form)
    const model = values.get('model').trim()
    const part = values.get('part').trim()
    const name = values.get('manufacturer')?.trim()
    const email = values.get('email')?.trim()
    const contact = choice.value === 'custom' && name && emailPattern.test(email)
      ? { name, email }
      : contacts.get(choice.value)
    if (!contact || !model || !part) {
      $('parts-form-status').textContent = 'Enter the manufacturer’s official contact, your model, and the part you need.'
      return
    }
    selected = contact
    const request = buildRequest(contact, model, part, values.get('kind'))
    subject.value = request.subject
    message.value = request.message
    submitted = false
    approved.checked = false
    review.hidden = false
    subject.readOnly = false
    message.readOnly = false
    $('parts-reviewed-recipient').textContent = contact.email ? 'To: ' + contact.email : 'Submit via ' + contact.name + ' support.'
    sendStatus.textContent = ''
    copyStatus.textContent = ''
    updateReviewActions()
    $('parts-review-heading').focus()
  })

  review.addEventListener('input', event => {
    if (event.target === subject || event.target === message) approved.checked = false
    updateReviewActions()
  })

  review.addEventListener('submit', async event => {
    event.preventDefault()
    if (!selected?.id || sendButton.disabled) return
    sending = true
    subject.readOnly = true
    message.readOnly = true
    approved.disabled = true
    choice.disabled = true
    sendStatus.textContent = 'Sending to ' + selected.name + '…'
    updateReviewActions()
    try {
      const response = await fetch('/api/parts/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          manufacturerId: selected.id,
          subject: subject.value.trim(),
          message: message.value.trim(),
          approved: approved.checked
        })
      })
      const result = await response.json()
      if (!response.ok || !result.reference) throw new Error(result.message || 'Email delivery could not be confirmed.')
      submitted = true
      sendStatus.textContent = 'Your email was accepted for delivery to ' + result.recipient + '. Watch ' +
        access.replyTo + ' for replies. Reference: ' + result.reference
    } catch (error) {
      sendStatus.textContent = error.message || 'Sending could not be confirmed.'
      approved.checked = false
    } finally {
      sending = false
      subject.readOnly = submitted
      message.readOnly = submitted
      approved.disabled = false
      choice.disabled = false
      updateReviewActions()
    }
  })

  $('copy-parts-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('Subject: ' + subject.value + '\n\n' + message.value)
      copyStatus.textContent = 'Message copied.'
    } catch {
      message.select()
      copyStatus.textContent = 'The message is selected. Use your browser’s copy shortcut.'
    }
  })

  showContact()
  return { open }
}
