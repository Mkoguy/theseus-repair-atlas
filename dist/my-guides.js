const STORAGE_KEY = 'theseus:personal-guides'
const ROOT = '#my-guides'
const MAX_STEPS = 30

function readGuides() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
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

  const guideLink = id => ROOT + '/' + encodeURIComponent(id)
  const categoryOptions = current => choices.map(name =>
    '<option' + (name === current ? ' selected' : '') + '>' + text(name) + '</option>'
  ).join('')
  const heading = title => '<h1 id="my-guides-title" tabindex="-1">' + text(title) + '</h1>'
  const back = '<a class="personal-back" href="' + ROOT + '">Back to My Guides</a>'
  const list = values => '<ul class="supply-list">' + values.map(value => '<li>' + text(value) + '</li>').join('') + '</ul>'

  function showLibrary() {
    document.title = 'My Guides — Theseus'
    content.innerHTML = '<div class="personal-heading"><div>' + heading('My Guides') +
      '<p>Find the repair guides you’ve written. They are saved in this browser.</p></div>' +
      '<a class="button button-primary" href="' + ROOT + '/new">Create a guide</a></div>' +
      '<div class="personal-filters">' +
      '<label>Search my guides<input id="my-guide-search" type="search" placeholder="Search titles, tools, or steps" value="' + text(query) + '"></label>' +
      '<label>Category<select id="my-guide-category"><option value="">All categories</option>' + categoryOptions(category) + '</select></label></div>' +
      '<p id="personal-count" class="personal-muted" role="status"></p><div id="personal-results"></div>'
    renderResults()
  }

  function renderResults() {
    const guides = readGuides()
    const term = query.toLowerCase().trim()
    const matching = guides.filter(guide => {
      if (category && guide.category !== category) return false
      const words = [guide.title, guide.summary, guide.category, guide.safety, ...guide.tools, ...guide.parts, ...guide.steps].join(' ').toLowerCase()
      return term.split(/\s+/).every(word => words.includes(word))
    }).sort((a, b) => b.updated - a.updated)
    const count = content.querySelector('#personal-count')
    const results = content.querySelector('#personal-results')
    const countLabel = matching.length + (matching.length === 1 ? ' guide' : ' guides')
    count.textContent = pendingMessage ? pendingMessage + ' ' + countLabel : countLabel
    pendingMessage = ''
    results.classList.toggle('personal-grid', matching.length > 0)
    if (!matching.length) {
      results.innerHTML = '<div class="personal-panel"><h2>' + (guides.length ? 'No matching guides' : 'Your library is empty') + '</h2><p>' +
        (guides.length ? 'Try another search or category.' : 'Create a guide to keep your repair notes, tools, and steps together.') + '</p></div>'
      return
    }
    results.innerHTML = matching.map(guide =>
      '<article class="personal-panel personal-card"><p class="personal-meta">' + text(guide.category) + ' · ' + guide.steps.length + (guide.steps.length === 1 ? ' step' : ' steps') + '</p>' +
      '<h2><a href="' + text(guideLink(guide.id)) + '">' + text(guide.title) + '</a></h2>' +
      (guide.summary ? '<p>' + text(guide.summary) + '</p>' : '') + '</article>'
    ).join('')
  }

  function showGuide(guide) {
    document.title = guide.title + ' — My Guides'
    const supplies = [
      guide.tools.length ? '<section class="personal-panel"><h2>Tools</h2>' + list(guide.tools) + '</section>' : '',
      guide.parts.length ? '<section class="personal-panel"><h2>Parts and materials</h2>' + list(guide.parts) + '</section>' : ''
    ].filter(Boolean)
    const link = webUrl(guide.reference)
    content.innerHTML = back + '<div class="personal-heading"><div><p class="personal-meta">' + text(guide.category) + '</p>' +
      heading(guide.title) + (guide.summary ? '<p>' + text(guide.summary) + '</p>' : '') + '</div>' +
      '<a class="button button-primary" href="' + text(guideLink(guide.id) + '/edit') + '">Edit guide</a></div>' +
      (pendingMessage ? '<p class="personal-muted" role="status">' + text(pendingMessage) + '</p>' : '') +
      (guide.safety ? '<section class="personal-panel personal-warning"><h2>Before you begin</h2><p>' + text(guide.safety) + '</p></section>' : '') +
      (supplies.length ? '<div class="personal-supplies">' + supplies.join('') + '</div>' : '') +
      '<section class="personal-panel personal-instructions"><h2>Repair steps</h2><ol>' +
      guide.steps.map(step => '<li><p>' + text(step) + '</p></li>').join('') + '</ol></section>' +
      (link ? '<p><a class="button button-secondary" href="' + text(link) + '" target="_blank" rel="noopener noreferrer">Open reference link</a></p>' : '') +
      '<div class="personal-delete"><button type="button" class="button button-secondary" data-personal-delete>Delete guide</button>' +
      '<div id="personal-delete-confirm" hidden><p>Delete “' + text(guide.title) + '” from this browser?</p>' +
      '<button class="button button-primary" type="button" data-personal-confirm>Yes, delete</button> ' +
      '<button class="button button-secondary" type="button" data-personal-cancel>Keep guide</button></div>' +
      '<p id="personal-error" role="alert"></p></div>'
    pendingMessage = ''
    content.querySelector('[data-personal-confirm]').dataset.personalConfirm = guide.id
  }

  function appendStep(value = '') {
    const container = content.querySelector('#personal-steps')
    const row = document.createElement('div')
    row.className = 'personal-step'
    row.innerHTML = '<label><span></span><textarea name="step" rows="2" maxlength="1200" required>' + text(value) + '</textarea></label>' +
      '<button class="button button-secondary" type="button" data-personal-remove>Remove</button>'
    container.append(row)
    return row
  }

  function numberSteps() {
    const rows = [...content.querySelectorAll('.personal-step')]
    rows.forEach((row, index) => {
      row.querySelector('label span').textContent = 'Step ' + (index + 1)
      const remove = row.querySelector('button')
      remove.setAttribute('aria-label', 'Remove step ' + (index + 1))
      remove.disabled = rows.length === 1
    })
    content.querySelector('[data-personal-add]').disabled = rows.length >= MAX_STEPS
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
      '<form id="personal-editor" class="personal-panel personal-editor">' +
      '<div class="personal-fields">' + field('Guide title (required)', 'title', 120) +
      '<label>Category<select name="category">' + categoryOptions(guide?.category) + '</select></label></div>' +
      field('Summary', 'summary', 500, true) + field('Safety and preparation notes', 'safety', 1200, true) +
      '<div class="personal-fields"><label>Tools (one per line)<textarea name="tools" rows="3" maxlength="1200">' + text(guide?.tools.join('\n') || '') + '</textarea></label>' +
      '<label>Parts and materials (one per line)<textarea name="parts" rows="3" maxlength="1200">' + text(guide?.parts.join('\n') || '') + '</textarea></label></div>' +
      '<fieldset class="personal-step-fields"><legend>Repair steps (at least one required)</legend><div id="personal-steps"></div>' +
      '<button class="button button-secondary" type="button" data-personal-add>Add a step</button></fieldset>' +
      '<label>Video or reference URL<input name="reference" type="url" maxlength="1500" placeholder="https://" value="' + text(guide?.reference || '') + '"></label>' +
      '<div><button class="button button-primary" type="submit">Save guide</button></div><p id="personal-error" role="alert"></p></form>'
    const form = content.querySelector('form')
    if (guide) form.dataset.id = guide.id
    for (const step of guide?.steps || ['']) appendStep(step)
    numberSteps()
  }

  function open(hash) {
    const [, id, action] = hash.split('/')
    if (!id) return showLibrary()
    if (id === 'new' && !action) return showEditor()
    const guide = readGuides().find(item => item.id === id)
    if (!guide) {
      document.title = 'Guide unavailable — Theseus'
      content.innerHTML = back + '<div class="personal-heading">' + heading('Guide unavailable') +
        '</div><p>This guide may have been deleted or saved in another browser.</p>'
      return
    }
    if (action === 'edit') showEditor(guide)
    else showGuide(guide)
  }

  content.addEventListener('input', event => {
    if (event.target.id !== 'my-guide-search') return
    query = event.target.value
    renderResults()
  })

  content.addEventListener('change', event => {
    if (event.target.id !== 'my-guide-category') return
    category = event.target.value
    renderResults()
  })

  content.addEventListener('submit', event => {
    const form = event.target
    if (form.id !== 'personal-editor') return
    event.preventDefault()
    const values = new FormData(form)
    const get = field => String(values.get(field) || '').trim()
    const lines = field => get(field).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    const problem = content.querySelector('#personal-error')
    const steps = values.getAll('step').map(value => value.trim())
    if (!get('title') || steps.some(step => !step)) {
      problem.textContent = 'Enter a title and fill in each step before saving.'
      return
    }
    const reference = webUrl(get('reference'))
    if (get('reference') && !reference) {
      problem.textContent = 'Use a web address starting with https:// or http://.'
      form.elements.reference.focus()
      return
    }
    const guides = readGuides()
    const id = form.dataset.id || crypto.randomUUID()
    const guide = {
      id, title: get('title'), summary: get('summary'), category: get('category'), safety: get('safety'),
      tools: lines('tools'), parts: lines('parts'), steps, reference, updated: Date.now()
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...guides.filter(item => item.id !== id), guide]))
    } catch {
      problem.textContent = 'This browser could not save your guide. Your edits are still here.'
      return
    }
    pendingMessage = 'Guide saved.'
    location.hash = guideLink(id)
  })

  content.addEventListener('click', event => {
    const button = event.target.closest('button')
    if (!button) return
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
      try {
        const remaining = readGuides().filter(guide => guide.id !== button.dataset.personalConfirm)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
      } catch {
        content.querySelector('#personal-error').textContent = 'This browser could not delete the guide.'
        return
      }
      pendingMessage = 'Guide deleted.'
      location.hash = ROOT
    }
  })

  return { open }
}

