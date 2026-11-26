import { deleteGuide, getGuide, getGuides, saveGuide } from './guide-storage.js'
import { prepareGuidePhoto } from './guide-photos.js'
import { difficultyLevels, difficultyMarkup, difficultyStars } from './guide-difficulty.js'
import { readMesh } from './mesh-geometry.js'
import { mountModelViewer } from './model-viewer.js'

const ROOT = '#my-guides'
const MAX_STEPS = 30
const MAX_PHOTOS = 6
const MAX_PARTS = 40
const MAX_MODELS = 3

function guideParts(guide) {
  return guide.parts.map(part => typeof part === 'string' ? { name: part, quantity: '', url: '' } : part)
}

function webUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function createPersonalGuides({ content, categories, escapeHtml: text }) {
  const choices = [...categories, 'Other']
  let query = ''
  let category = ''
  let pendingMessage = ''
  let library = []
  let editor
  let pageVersion = 0
  let articleModels = []
  let activeViewer
  const imageUrls = new Map()

  function photoUrl(blob) {
    if (!imageUrls.has(blob)) imageUrls.set(blob, URL.createObjectURL(blob))
    return imageUrls.get(blob)
  }

  function releasePhotos() {
    for (const url of imageUrls.values()) URL.revokeObjectURL(url)
    imageUrls.clear()
  }

  function close() {
    pageVersion++
    activeViewer?.destroy()
    activeViewer = undefined
    articleModels = []
    releasePhotos()
    library = []
    editor = undefined
    content.replaceChildren()
  }

  const guideLink = id => ROOT + '/' + encodeURIComponent(id)
  const categoryOptions = current => choices.map(name =>
    '<option' + (name === current ? ' selected' : '') + '>' + text(name) + '</option>'
  ).join('')
  const heading = title => '<h1 id="my-guides-title" tabindex="-1">' + text(title) + '</h1>'
  const back = '<a class="personal-back" href="' + ROOT + '">Back to My Guides</a>'
  const list = values => '<ul class="supply-list">' + values.map(value => '<li>' + text(value) + '</li>').join('') + '</ul>'

  function paragraphs(value) {
    if (!value) return ''
    return value.split(/\n\s*\n/).map(paragraph => '<p>' +
      text(paragraph).replace(/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g,
        (_, bold, italic) => bold ? '<strong>' + bold + '</strong>' : '<em>' + italic + '</em>') + '</p>'
    ).join('')
  }

  function partsMarkup(parts) {
    if (!parts.length) return ''
    return '<section class="personal-panel"><h2>Parts and materials</h2><ul class="personal-parts-list">' +
      parts.map(part => {
        const url = webUrl(part.url)
        const quantity = part.quantity ? '<small class="personal-part-quantity">Quantity: ' + text(part.quantity) + '</small>' : ''
        const purchase = url ? '<a class="button button-secondary" href="' + text(url) + '" target="_blank" rel="noopener noreferrer" aria-label="Buy ' +
          text(part.name) + ' (opens in a new tab)">Buy part</a>' : ''
        return '<li><span><strong>' + text(part.name) + '</strong>' + quantity + '</span>' + purchase + '</li>'
      }).join('') + '</ul></section>'
  }

  function photoGallery(photos) {
    if (!photos?.length) return ''
    return '<section class="personal-panel personal-gallery"><h2>Photos</h2><div class="personal-photo-grid">' +
      photos.map((photo, index) => {
        const url = text(photoUrl(photo.blob))
        const label = 'Open photo ' + (index + 1) + ' at full size'
        const description = photo.description || 'Repair photo ' + (index + 1)
        return '<figure><a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + url + '" width="' + photo.width + '" height="' + photo.height + '" alt="' + text(description) + '">' +
          '<span class="sr-only"> — ' + label + '</span></a>' +
          (photo.description ? '<figcaption>' + text(photo.description) + '</figcaption>' : '') + '</figure>'
      }).join('') + '</div></section>'
  }

  function showLibrary() {
    document.title = 'My Guides — Theseus'
    content.innerHTML = '<div class="personal-heading"><div>' + heading('My Guides') +
      '<p>Find the repair guides you’ve written. They are saved in this browser.</p></div>' +
      '<a class="button button-primary" href="' + ROOT + '/new">Create a guide</a></div>' +
      '<div class="personal-filters">' +
      '<label>Search my guides<input id="my-guide-search" type="search" placeholder="Search titles, parts, or steps" value="' + text(query) + '"></label>' +
      '<label>Category<select id="my-guide-category"><option value="">All categories</option>' + categoryOptions(category) + '</select></label></div>' +
      '<p id="personal-count" class="personal-muted" role="status"></p><div id="personal-results"></div>'
    renderResults()
  }

  function renderResults() {
    const term = query.toLowerCase().trim()
    const matching = library.filter(guide => {
      if (category && guide.category !== category) return false
      const parts = guideParts(guide).map(part => part.name)
      const words = [guide.title, guide.summary, guide.category, guide.safety, ...guide.tools, ...parts, ...guide.steps].join(' ').toLowerCase()
      return term.split(/\s+/).every(word => words.includes(word))
    }).sort((a, b) => b.updated - a.updated)
    const count = content.querySelector('#personal-count')
    const results = content.querySelector('#personal-results')
    const countLabel = matching.length + (matching.length === 1 ? ' guide' : ' guides')
    count.textContent = pendingMessage ? pendingMessage + ' ' + countLabel : countLabel
    pendingMessage = ''
    results.classList.toggle('personal-grid', matching.length > 0)
    if (!matching.length) {
      results.innerHTML = '<div class="personal-panel"><h2>' + (library.length ? 'No matching guides' : 'Your library is empty') + '</h2><p>' +
        (library.length ? 'Try another search or category.' : 'Create a guide to keep your repair notes, tools, and steps together.') + '</p></div>'
      return
    }
    results.innerHTML = matching.map(guide =>
      '<article class="personal-panel personal-card"><p class="personal-meta">' + text(guide.category) + ' · ' + guide.steps.length + (guide.steps.length === 1 ? ' step' : ' steps') + '</p>' +
      '<h2><a href="' + text(guideLink(guide.id)) + '">' + text(guide.title) + '</a></h2>' +
      '<p class="personal-difficulty">' + difficultyMarkup(guide.difficulty) + '</p>' +
      (guide.summary ? '<p>' + text(guide.summary) + '</p>' : '') + '</article>'
    ).join('')
  }

  function articleMarkup(guide, preview = false) {
    const supplies = [
      guide.tools.length ? '<section class="personal-panel"><h2>Tools</h2>' + list(guide.tools) + '</section>' : '',
      partsMarkup(guideParts(guide))
    ].filter(Boolean)
    const link = webUrl(guide.reference)
    articleModels = guide.models || []
    const title = preview ? '<h2 id="document-preview-title" tabindex="-1">' + text(guide.title || 'Untitled guide') + '</h2>' : heading(guide.title)
    const steps = guide.steps.map((step, i) => {
      const stepTitle = guide.stepTitles?.[i]
      return '<li><div><h3>' + text(stepTitle || 'Step ' + (i + 1)) + '</h3>' +
        (paragraphs(step) || '<p class="personal-muted">Add instructions for this step.</p>') + '</div></li>'
    }).join('')
    const models = articleModels.length ? '<section class="personal-panel doc-models"><h2>3D part files</h2><ul>' +
      articleModels.map((attachment, index) => '<li><span>' + text(attachment.name) + '</span>' +
        '<div class="doc-file-actions"><button type="button" class="button button-secondary" data-model-preview="' + index + '">Preview 3D</button>' +
        '<a class="button button-secondary" href="' + text(photoUrl(attachment)) + '" download="' + text(attachment.name) + '">Download</a></div></li>').join('') +
      '</ul><div class="inline-model-viewer"></div></section>' : ''
    return '<article class="guide-document"><header class="doc-article-header"><p class="personal-meta">' + text(guide.category) + '</p>' +
      title + '<p class="personal-difficulty">' + difficultyMarkup(guide.difficulty) + '</p>' +
      '<div class="doc-lead">' + paragraphs(guide.summary) + '</div></header>' +
      (guide.safety ? '<section class="personal-panel personal-warning"><h2>Before you begin</h2>' + paragraphs(guide.safety) + '</section>' : '') +
      (supplies.length ? '<div class="personal-supplies">' + supplies.join('') + '</div>' : '') +
      photoGallery(guide.photos) +
      '<section class="personal-instructions"><h2>Repair steps</h2><ol class="doc-step-list">' + steps + '</ol></section>' +
      models +
      (link ? '<p><a class="button button-secondary" href="' + text(link) + '" target="_blank" rel="noopener noreferrer">Open reference link</a></p>' : '') +
      '</article>'
  }

  function showGuide(guide) {
    document.title = guide.title + ' — My Guides'
    content.innerHTML = '<div class="doc-reader-bar">' + back +
      '<a class="button button-primary" href="' + text(guideLink(guide.id) + '/edit') + '">Edit guide</a></div>' +
      (pendingMessage ? '<p class="personal-muted" role="status">' + text(pendingMessage) + '</p>' : '') +
      articleMarkup(guide) +
      '<div class="personal-delete"><button type="button" class="button button-secondary" data-personal-delete>Delete guide</button>' +
      '<div id="personal-delete-confirm" hidden><p>Delete “' + text(guide.title) + '” from this browser?</p>' +
      '<button class="button button-primary" type="button" data-personal-confirm>Yes, delete</button> ' +
      '<button class="button button-secondary" type="button" data-personal-cancel>Keep guide</button></div>' +
      '<p id="personal-error" role="alert"></p></div>'
    pendingMessage = ''
    content.querySelector('[data-personal-confirm]').dataset.personalConfirm = guide.id
  }

  function appendStep(value = '', title = '') {
    const container = content.querySelector('#personal-steps')
    const row = document.createElement('div')
    row.className = 'personal-step'
    row.innerHTML = '<div class="doc-step-top"><strong class="doc-step-number"></strong><div>' +
      '<button class="button button-secondary" type="button" data-step-move="up">Move up</button> ' +
      '<button class="button button-secondary" type="button" data-step-move="down">Move down</button> ' +
      '<button class="button button-secondary" type="button" data-personal-remove>Remove</button></div></div>' +
      '<label><span class="sr-only">Step heading (optional)</span><input name="step-title" maxlength="120" placeholder="Step heading (optional)" value="' + text(title) + '"></label>' +
      '<label><span class="sr-only">Step instructions</span><textarea name="step" rows="3" maxlength="1200" placeholder="Write the instructions for this step…" required>' + text(value) + '</textarea></label>'
    container.append(row)
    return row
  }

  function numberSteps() {
    const rows = [...content.querySelectorAll('.personal-step')]
    rows.forEach((row, index) => {
      row.querySelector('.doc-step-number').textContent = 'Step ' + (index + 1)
      row.querySelector('[name="step"]').setAttribute('aria-label', 'Step ' + (index + 1) + ' instructions')
      row.querySelector('[name="step-title"]').setAttribute('aria-label', 'Step ' + (index + 1) + ' heading')
      row.querySelector('[data-step-move="up"]').disabled = index === 0
      row.querySelector('[data-step-move="down"]').disabled = index === rows.length - 1
      const remove = row.querySelector('[data-personal-remove]')
      remove.setAttribute('aria-label', 'Remove step ' + (index + 1))
      remove.disabled = rows.length === 1
    })
    content.querySelector('[data-personal-add]').disabled = rows.length >= MAX_STEPS
  }

  function appendPart(part = {}) {
    const row = document.createElement('div')
    row.className = 'personal-part-row'
    row.innerHTML = '<label>Part name<input name="part-name" maxlength="120" value="' + text(part.name || '') + '"></label>' +
      '<label>Quantity<input name="part-quantity" maxlength="40" value="' + text(part.quantity || '') + '"></label>' +
      '<label>Purchase link<input name="part-link" type="url" maxlength="1500" placeholder="https://" value="' + text(part.url || '') + '"></label>' +
      '<button class="button button-secondary" type="button" data-part-remove>Remove part</button>'
    content.querySelector('#personal-parts').append(row)
    updatePartCount()
    return row
  }

  function updatePartCount() {
    const rows = [...content.querySelectorAll('.personal-part-row')]
    rows.forEach((row, index) => {
      row.querySelector('button').setAttribute('aria-label', 'Remove part ' + (index + 1))
    })
    content.querySelector('[data-part-add]').disabled = rows.length >= MAX_PARTS
  }

  function renderPhotoEditor() {
    const preview = editor.form.querySelector('#personal-photos')
    preview.innerHTML = editor.photos.map((photo, index) => {
      const label = 'Photo ' + (index + 1)
      return '<div class="personal-photo-entry"><img src="' + text(photoUrl(photo.blob)) + '" alt="' + text(label) + '">' +
        '<label>' + label + ' description<input maxlength="200" data-photo-description="' + index +
        '" value="' + text(photo.description) + '" placeholder="Describe what the photo shows"></label>' +
        '<button class="button button-secondary" type="button" data-photo-remove="' + index + '">Remove ' + label.toLowerCase() + '</button></div>'
    }).join('')
    editor.form.querySelector('#personal-photo-input').disabled = editor.busy || editor.saving || editor.photos.length >= MAX_PHOTOS
  }

  function renderModelFiles() {
    const { form, models, saving, busy } = editor
    form.querySelector('#personal-model-input').disabled = saving || busy || models.length >= MAX_MODELS
    form.querySelector('#personal-model-files').innerHTML = models.map((file, index) =>
      '<li><span>' + text(file.name) + '</span><button type="button" class="button button-secondary" data-model-remove="' +
      index + '">Remove <span class="sr-only">' + text(file.name) + '</span></button></li>'
    ).join('')
  }

  function showDocumentPreview() {
    const preview = content.querySelector('#personal-document-preview')
    if (editor.busy || editor.saving) return
    editor.form.hidden = true
    preview.innerHTML = articleMarkup(collectDocument(editor), true)
    preview.hidden = false
    content.querySelector('[data-doc-mode="preview"]').setAttribute('aria-pressed', 'true')
    content.querySelector('[data-doc-mode="edit"]').setAttribute('aria-pressed', 'false')
    preview.querySelector('h2').focus()
  }

  function showDocumentEditor() {
    activeViewer?.destroy()
    activeViewer = undefined
    const preview = content.querySelector('#personal-document-preview')
    preview.hidden = true
    preview.replaceChildren()
    releasePhotos()
    renderPhotoEditor()
    editor.form.hidden = false
    content.querySelector('[data-doc-mode="edit"]').setAttribute('aria-pressed', 'true')
    content.querySelector('[data-doc-mode="preview"]').setAttribute('aria-pressed', 'false')
  }

  function showEditor(guide) {
    const title = guide ? 'Edit guide' : 'Create a guide'
    document.title = title + ' — Theseus'
    const field = (label, name, max, multiline = false) => {
      const value = text(guide?.[name] || '')
      return '<label>' + label + (multiline
        ? '<textarea name="' + name + '" rows="3" maxlength="' + max + '">' + value + '</textarea>'
        : '<input name="' + name + '" maxlength="' + max + '" value="' + value + '" required>') + '</label>'
    }
    content.innerHTML = (guide ? '<a class="personal-back" href="' + text(guideLink(guide.id)) + '">Back to guide</a>' : back) +
      '<div class="personal-heading">' + heading(title) + '</div>' +
      '<div class="doc-toolbar" role="toolbar" aria-label="Guide editing tools">' +
      '<button class="button button-secondary" type="button" data-doc-mode="edit" aria-pressed="true">Edit</button>' +
      '<button class="button button-secondary" type="button" data-doc-mode="preview" aria-pressed="false">Preview</button>' +
      '<span class="doc-toolbar-divider" aria-hidden="true"></span>' +
      '<button class="button button-secondary" type="button" data-doc-style="bold" aria-label="Bold selected text"><strong>B</strong></button>' +
      '<button class="button button-secondary" type="button" data-doc-style="italic" aria-label="Italicize selected text"><em>I</em></button>' +
      '<button class="button button-primary doc-toolbar-save" type="submit" form="personal-editor" data-save-document>Save guide</button></div>' +
      '<div class="doc-builder-layout"><div class="doc-outline" role="group" aria-label="Document outline">' +
      '<button type="button" data-doc-jump="doc-intro">Introduction</button>' +
      '<button type="button" data-doc-jump="doc-supplies">Tools &amp; parts</button>' +
      '<button type="button" data-doc-jump="doc-steps">Repair steps</button>' +
      '<button type="button" data-doc-jump="doc-attachments">Attachments</button></div>' +
      '<form id="personal-editor" class="personal-panel personal-editor guide-paper">' +
      '<section id="doc-intro" class="doc-editor-section"><h2>Introduction</h2>' +
      '<label class="doc-title-field"><span class="sr-only">Guide title (required)</span>' +
      '<input name="title" maxlength="120" required placeholder="Name your repair guide" value="' + text(guide?.title || '') + '"></label>' +
      '<label>Category<select name="category">' + categoryOptions(guide?.category) + '</select></label>' +
      '<label>Difficulty (required)<select name="difficulty" required aria-describedby="difficulty-help">' +
      '<option value="">Choose a star rating</option>' +
      difficultyLevels.map(level => '<option value="' + level + '"' + (guide?.difficulty === level ? ' selected' : '') + '>' +
        difficultyStars(level) + ' ' + level + ' out of 5</option>').join('') + '</select>' +
      '<small class="personal-muted" id="difficulty-help">1 star is easiest. 5 stars is hardest.</small></label>' +
      field('Summary', 'summary', 500, true) + field('Safety and preparation notes', 'safety', 1200, true) + '</section>' +
      '<section id="doc-supplies" class="doc-editor-section"><h2>Tools &amp; parts</h2>' +
      '<label>Tools (one per line)<textarea name="tools" rows="3" maxlength="1200">' + text(guide?.tools.join('\n') || '') + '</textarea></label>' +
      '<fieldset class="personal-step-fields"><legend>Parts and materials</legend><div id="personal-parts"></div>' +
      '<button class="button button-secondary" type="button" data-part-add>Add a part</button></fieldset></section>' +
      '<section id="doc-steps" class="doc-editor-section"><h2>Repair steps</h2><div id="personal-steps"></div>' +
      '<div><button class="button button-secondary" type="button" data-personal-add>Add a step</button></div></section>' +
      '<section id="doc-attachments" class="doc-editor-section"><h2>Attachments</h2>' +
      '<fieldset class="personal-step-fields"><legend>Photos</legend>' +
      '<label>Attach images<input id="personal-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple aria-describedby="personal-photo-help"></label>' +
      '<p id="personal-photo-help" class="personal-muted">Up to six photos per guide. JPEG, PNG, WebP, or GIF, up to 15 MB each. Images are resized and stored in this browser.</p>' +
      '<div class="personal-photo-grid" id="personal-photos"></div><p class="personal-muted" id="personal-photo-status" role="status"></p></fieldset>' +
      '<fieldset class="personal-step-fields"><legend>3D part files</legend>' +
      '<label>Attach a 3D model<input id="personal-model-input" type="file" accept=".stl,.obj" aria-describedby="personal-model-help"></label>' +
      '<p class="personal-muted" id="personal-model-help">Attach up to three STL or OBJ files, up to 25 MB each.</p>' +
      '<ul class="doc-file-list" id="personal-model-files"></ul><p class="personal-muted" id="personal-model-status" role="status"></p></fieldset>' +
      '<label>Video or reference URL<input name="reference" type="url" maxlength="1500" placeholder="https://" value="' + text(guide?.reference || '') + '"></label>' +
      '</section><p id="personal-error" role="alert"></p></form>' +
      '<div id="personal-document-preview" hidden></div></div>'
    const form = content.querySelector('form')
    editor = { form, id: guide?.id, photos: guide?.photos || [], models: guide?.models || [], busy: false }
    for (const part of guide ? guideParts(guide) : []) appendPart(part)
    updatePartCount()
    renderPhotoEditor()
    renderModelFiles()
    const steps = guide?.steps || ['']
    steps.forEach((step, index) => appendStep(step, guide?.stepTitles?.[index]))
    numberSteps()
  }

  async function open(hash) {
    close()
    const version = pageVersion
    const [, id, action] = hash.split('/')
    if (id === 'new' && !action) {
      showEditor()
    } else {
      content.innerHTML = '<div class="personal-heading">' + heading('My Guides') + '</div><p role="status">Loading guides…</p>'
      try {
        if (id) {
          const guide = await getGuide(id)
          if (version !== pageVersion) return
          if (guide && action === 'edit') showEditor(guide)
          else if (guide) showGuide(guide)
          else {
            document.title = 'Guide unavailable — Theseus'
            content.innerHTML = back + '<div class="personal-heading">' + heading('Guide unavailable') +
              '</div><p>This guide may have been deleted or saved in another browser.</p>'
          }
        } else {
          const guides = await getGuides()
          if (version !== pageVersion) return
          library = guides
          showLibrary()
        }
      } catch {
        if (version !== pageVersion) return
        document.title = 'My Guides — Theseus'
        content.innerHTML = '<div class="personal-heading">' + heading('My Guides') +
          '</div><p role="alert">Theseus could not open your guide library. Try reloading or check whether this browser allows site storage.</p>'
      }
    }
    content.querySelector('#my-guides-title').focus({ preventScroll: true })
  }

  content.addEventListener('input', event => {
    const photoIndex = event.target.dataset.photoDescription
    if (photoIndex !== undefined && editor?.photos[photoIndex]) {
      editor.photos[photoIndex].description = event.target.value
      return
    }
    if (event.target.id !== 'my-guide-search') return
    query = event.target.value
    renderResults()
  })

  content.addEventListener('focusin', event => {
    if (editor && event.target.matches('textarea[name="summary"], textarea[name="safety"], textarea[name="step"]')) {
      editor.textField = event.target
    }
  })

  function setBusy(current, busy) {
    current.busy = busy
    content.querySelector('[data-save-document]').disabled = busy
    current.form.querySelector('#personal-photo-input').disabled = busy || current.photos.length >= MAX_PHOTOS
    current.form.querySelector('#personal-model-input').disabled = busy || current.models.length >= MAX_MODELS
    content.querySelector('[data-doc-mode="preview"]').disabled = busy
  }

  content.addEventListener('change', async event => {
    if (event.target.id === 'personal-model-input') {
      const current = editor
      const file = event.target.files[0]
      event.target.value = ''
      if (!file || current.busy || current.saving || current.models.length >= MAX_MODELS) return
      const status = current.form.querySelector('#personal-model-status')
      setBusy(current, true)
      status.textContent = 'Checking the model…'
      try {
        await readMesh(file)
        if (current !== editor) return
        current.models.push(file)
        status.textContent = 'Attached ' + file.name + '.'
      } catch (error) {
        status.textContent = error.message
      } finally {
        if (current === editor) {
          setBusy(current, false)
          renderModelFiles()
        }
      }
      return
    }
    if (event.target.id === 'personal-photo-input') {
      const current = editor
      const files = [...event.target.files]
      event.target.value = ''
      if (!files.length || current.busy) return
      const status = current.form.querySelector('#personal-photo-status')
      const room = MAX_PHOTOS - current.photos.length
      const messages = []
      setBusy(current, true)
      status.textContent = 'Preparing photos…'
      if (files.length > room) messages.push('Only ' + room + ' more photos can fit.')
      for (const file of files.slice(0, room)) {
        try {
          const photo = await prepareGuidePhoto(file)
          if (current !== editor) return
          current.photos.push(photo)
        } catch (error) {
          messages.push(file.name + ': ' + (error instanceof DOMException ? 'Could not read the image.' : error.message))
        }
      }
      if (current !== editor) return
      setBusy(current, false)
      renderPhotoEditor()
      status.textContent = current.photos.length + ' of ' + MAX_PHOTOS + ' photos attached. ' + messages.join(' ')
      return
    }
    if (event.target.id !== 'my-guide-category') return
    category = event.target.value
    renderResults()
  })

  function collectDocument(current) {
    const values = new FormData(current.form)
    const get = field => String(values.get(field) || '').trim()
    const parts = [...current.form.querySelectorAll('.personal-part-row')].map(row => ({
      name: row.querySelector('[name="part-name"]').value.trim(),
      quantity: row.querySelector('[name="part-quantity"]').value.trim(),
      url: webUrl(row.querySelector('[name="part-link"]').value.trim())
    })).filter(part => part.name)
    return {
      title: get('title'), summary: get('summary'), category: get('category'), safety: get('safety'),
      difficulty: Number(get('difficulty')), photos: current.photos.map(photo => ({ ...photo, description: photo.description.trim() })),
      tools: get('tools').split(/\r?\n/).map(line => line.trim()).filter(Boolean), parts,
      steps: values.getAll('step').map(value => value.trim()),
      stepTitles: values.getAll('step-title').map(value => value.trim()),
      reference: webUrl(get('reference')), models: [...current.models]
    }
  }

  content.addEventListener('submit', async event => {
    const form = event.target
    if (form.id !== 'personal-editor') return
    event.preventDefault()
    const current = editor
    if (current.busy || current.saving) return
    const problem = content.querySelector('#personal-error')
    problem.textContent = ''
    const guide = collectDocument(current)
    if (!guide.title || guide.steps.some(step => !step)) {
      problem.textContent = 'Enter a title and fill in each step before saving.'
      return
    }
    if (form.elements.reference.value.trim() && !guide.reference) {
      problem.textContent = 'Use a web address starting with https:// or http://.'
      form.elements.reference.focus()
      return
    }
    for (const row of form.querySelectorAll('.personal-part-row')) {
      const nameField = row.querySelector('[name="part-name"]')
      const linkField = row.querySelector('[name="part-link"]')
      const name = nameField.value.trim()
      const quantity = row.querySelector('[name="part-quantity"]').value.trim()
      const link = linkField.value.trim()
      if (!name && !quantity && !link) continue
      if (!name) {
        problem.textContent = 'Enter a name for each part or remove the row.'
        nameField.focus()
        return
      }
      if (link && !webUrl(link)) {
        problem.textContent = 'Part links must start with https:// or http://.'
        linkField.focus()
        return
      }
    }
    const id = current.id || crypto.randomUUID()
    current.saving = true
    setBusy(current, true)
    try {
      await saveGuide({ ...guide, id, updated: Date.now() })
    } catch {
      problem.textContent = 'This browser could not save your guide. Your edits are still here.'
      return
    } finally {
      current.saving = false
      if (current === editor) setBusy(current, false)
    }
    if (current !== editor) return
    pendingMessage = 'Guide saved.'
    location.hash = guideLink(id)
  })

  content.addEventListener('click', async event => {
    const button = event.target.closest('button')
    if (!button) return
    if (button.dataset.docMode === 'preview' && !editor.form.hidden) showDocumentPreview()
    if ((button.dataset.docMode === 'edit' || button.hasAttribute('data-save-document')) && editor.form.hidden) showDocumentEditor()
    if (button.dataset.docJump) {
      if (editor.form.hidden) showDocumentEditor()
      const section = document.getElementById(button.dataset.docJump)
      section.scrollIntoView({ block: 'start' })
      section.querySelector('input, textarea, button')?.focus({ preventScroll: true })
    }
    if (button.dataset.docStyle) {
      if (editor.form.hidden) showDocumentEditor()
      const active = editor.textField?.isConnected ? editor.textField : editor.form.elements.summary
      const start = active.selectionStart
      const end = active.selectionEnd
      const selected = active.value.slice(start, end)
      const marker = button.dataset.docStyle === 'bold' ? '**' : '*'
      if (active.value.length + marker.length * 2 <= active.maxLength) {
        active.setRangeText(marker + selected + marker, start, end, 'end')
        active.focus()
        active.setSelectionRange(start + marker.length, start + marker.length + selected.length)
      }
    }
    if (button.dataset.stepMove) {
      const row = button.closest('.personal-step')
      const neighbor = button.dataset.stepMove === 'up' ? row.previousElementSibling : row.nextElementSibling
      if (neighbor) {
        if (button.dataset.stepMove === 'up') neighbor.before(row)
        else neighbor.after(row)
        numberSteps()
        row.querySelector('[name="step-title"]').focus({ preventScroll: true })
      }
    }
    if (button.dataset.modelRemove !== undefined) {
      editor.models.splice(Number(button.dataset.modelRemove), 1)
      renderModelFiles()
      editor.form.querySelector('#personal-model-input').focus()
    }
    if (button.dataset.modelPreview !== undefined) {
      const model = articleModels[Number(button.dataset.modelPreview)]
      const target = button.closest('.doc-models').querySelector('.inline-model-viewer')
      activeViewer?.destroy()
      activeViewer = mountModelViewer(target, { picker: false })
      activeViewer.load(model)
    }
    if (button.hasAttribute('data-part-add')) appendPart().querySelector('input').focus()
    if (button.hasAttribute('data-part-remove')) {
      button.closest('.personal-part-row').remove()
      updatePartCount()
      content.querySelector('[data-part-add]').focus()
    }
    if (button.dataset.photoRemove !== undefined) {
      const [photo] = editor.photos.splice(Number(button.dataset.photoRemove), 1)
      URL.revokeObjectURL(imageUrls.get(photo.blob))
      imageUrls.delete(photo.blob)
      renderPhotoEditor()
      editor.form.querySelector('#personal-photo-status').textContent = 'Photo removed. ' + editor.photos.length + ' of ' + MAX_PHOTOS + ' attached.'
      editor.form.querySelector('#personal-photo-input').focus()
    }
    if (button.hasAttribute('data-personal-add')) {
      appendStep().querySelector('textarea').focus()
      numberSteps()
    }
    if (button.hasAttribute('data-personal-remove')) {
      const row = button.closest('.personal-step')
      const neighbor = row.nextElementSibling || row.previousElementSibling
      row.remove()
      numberSteps()
      neighbor?.querySelector('textarea').focus()
    }
    if (button.hasAttribute('data-personal-delete')) {
      content.querySelector('#personal-delete-confirm').hidden = false
      button.hidden = true
      content.querySelector('[data-personal-cancel]').focus()
    }
    if (button.hasAttribute('data-personal-cancel')) {
      content.querySelector('#personal-delete-confirm').hidden = true
      const trigger = content.querySelector('[data-personal-delete]')
      trigger.hidden = false
      trigger.focus()
    }
    if (button.dataset.personalConfirm) {
      const version = pageVersion
      const problem = content.querySelector('#personal-error')
      button.disabled = true
      try {
        await deleteGuide(button.dataset.personalConfirm)
      } catch {
        problem.textContent = 'This browser could not delete the guide.'
        return
      } finally {
        button.disabled = false
      }
      if (version !== pageVersion) return
      pendingMessage = 'Guide deleted.'
      location.hash = ROOT
    }
  })

  return { open, close }
}

