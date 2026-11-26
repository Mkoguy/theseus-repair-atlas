import { guides, categories } from './guides.js?v=stars'
import { initAiGuide } from './ai.js'
import { createPersonalGuides } from './my-guides.js?v=document-editor'
import { difficultyMarkup } from './guide-difficulty.js'
import { initPartsTools } from './parts-tools.js'

const $ = selector => document.querySelector(selector)
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const saved = new Set(readJson('theseus:saved', []))
const state = { query: '', category: 'All', action: 'All', level: 'All', videoOnly: false, savedOnly: false, sort: 'featured' }
const actions = ['All', 'Repair', 'Replace', 'Patch']
const levels = ['All', ...[...new Set(guides.map(guide => guide.difficulty))].sort((a, b) => a - b)]
const guideById = new Map(guides.map(guide => [guide.id, guide]))
const preferenceDefaults = {
  textSize: '100', palette: 'original', highContrast: false, darkMode: false,
  spaciousReading: false, calmLayout: false, reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  largeControls: false
}
const savedPreferences = readJson('theseus:preferences', {})
const preferences = { ...preferenceDefaults }
const allowedTextSizes = ['100', '125', '150', '200']
const allowedPalettes = ['original', 'blue-amber', 'coral-charcoal', 'monochrome']
for (const key of Object.keys(preferenceDefaults)) {
  const value = savedPreferences[key]
  if (key === 'textSize' && allowedTextSizes.includes(value)) preferences[key] = value
  else if (key === 'palette' && allowedPalettes.includes(value)) preferences[key] = value
  else if (typeof preferenceDefaults[key] === 'boolean' && typeof value === 'boolean') preferences[key] = value
}
if (!savedPreferences.textSize && readJson('theseus:largeText', false)) preferences.textSize = '125'

// Apply choices to the root so the same settings affect the catalogue and guides.
function applyPreferences(message = '') {
  const root = document.documentElement
  root.dataset.textSize = preferences.textSize
  root.dataset.palette = preferences.palette
  for (const key of ['darkMode', 'highContrast', 'spaciousReading', 'calmLayout', 'reduceMotion', 'largeControls']) root.dataset[key] = String(preferences[key])
  document.querySelectorAll('[data-setting]').forEach(control => {
    const value = preferences[control.dataset.setting]
    if (control.type === 'checkbox') control.checked = value
    else if (control.type === 'radio') control.checked = control.value === value
    else control.value = value
  })
  if (message) $('#settings-status').textContent = message
}

function savePreferences(message = 'Your choices were saved on this browser.') {
  try { localStorage.setItem('theseus:preferences', JSON.stringify(preferences)) } catch { message = 'Your changes are active for this visit, but this browser could not save them.' }
  applyPreferences(message)
}

// These small drawings are original vector artwork. They keep the catalogue
// recognizable without relying on third-party product photos or hotlinked media.
const artShapes = {
  wheel: `<circle cx="140" cy="101" r="76" fill="#f7f3e8" stroke="#234f55" stroke-width="12"/><circle cx="140" cy="101" r="55" fill="none" stroke="#4b7c81" stroke-width="3"/><circle cx="140" cy="101" r="12" fill="#d9785b"/><path d="M140 25v152M64 101h152M86 47l108 108M194 47 86 155" stroke="#4b7c81" stroke-width="3"/><path d="m187 34 15 10-9 15" stroke="#d9785b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  faucet: `<path d="M94 137V81c0-27 20-43 46-43 29 0 49 16 49 41v12h27v22h-54V80c0-13-8-21-22-21s-22 8-22 21v57" fill="#fffaf0" stroke="#245257" stroke-width="9" stroke-linejoin="round"/><path d="M74 137h65M96 66H70M83 49v33" stroke="#245257" stroke-width="9" stroke-linecap="round"/><path d="M204 127c0 10-9 21-9 21s-9-11-9-21a9 9 0 0 1 18 0Z" fill="#cf765d"/><path d="M65 155h166" stroke="#c58a65" stroke-width="5" stroke-linecap="round"/>`,
  wall: `<rect x="58" y="30" width="164" height="137" rx="4" fill="#fff7e7" stroke="#a66d58" stroke-width="5"/><path d="M59 71h162M59 118h162M110 31v40M169 72v45M105 119v48" stroke="#d2ad93" stroke-width="4"/><path d="m124 78 29-6 23 23-8 29-34 8-22-25Z" fill="#d6e7dc" stroke="#326d6b" stroke-width="4" stroke-dasharray="6 5"/><path d="m124 89 33 30M165 79l-30 48" stroke="#c97657" stroke-width="4"/>`,
  zipper: `<path d="M79 20v158M201 20v158" stroke="#245257" stroke-width="14" stroke-linecap="round"/><path d="M93 28h45v140H93M187 28h-39v140h39" fill="#f8f1e0" stroke="#245257" stroke-width="4"/><path d="M136 31v124M150 31v124" stroke="#d88a68" stroke-width="4" stroke-dasharray="7 7"/><rect x="128" y="77" width="30" height="43" rx="7" fill="#275b5c"/><path d="M143 115v27" stroke="#275b5c" stroke-width="7" stroke-linecap="round"/><circle cx="143" cy="149" r="9" fill="none" stroke="#275b5c" stroke-width="5"/>`,
  button: `<circle cx="140" cy="100" r="73" fill="#fff8e8" stroke="#245257" stroke-width="9"/><circle cx="113" cy="75" r="8" fill="#c87555"/><circle cx="167" cy="75" r="8" fill="#c87555"/><circle cx="113" cy="126" r="8" fill="#c87555"/><circle cx="167" cy="126" r="8" fill="#c87555"/><path d="m113 75 54 51m0-51-54 51" stroke="#1b6868" stroke-width="6" stroke-linecap="round"/><path d="M207 31c12 12 19 27 20 42" fill="none" stroke="#bb7357" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 7"/>`,
  laptop: `<rect x="48" y="30" width="184" height="113" rx="7" fill="#235052" stroke="#133b40" stroke-width="5"/><rect x="62" y="43" width="156" height="87" rx="2" fill="#dfe9d9"/><path d="M26 150h228l-16 24H43Z" fill="#e9ede2" stroke="#2e5b5e" stroke-width="5" stroke-linejoin="round"/><rect x="108" y="73" width="64" height="34" rx="4" fill="#f5d2a1" stroke="#c77657" stroke-width="4"/><path d="M136 79v22m9-11h-17" stroke="#c77657" stroke-width="4" stroke-linecap="round"/>`,
  screen: `<rect x="57" y="24" width="166" height="152" rx="5" fill="#fff5e4" stroke="#225157" stroke-width="9"/><path d="M81 26v147M105 26v147M129 26v147M153 26v147M177 26v147M201 26v147M61 48h159M61 73h159M61 98h159M61 123h159M61 148h159" stroke="#abc9b8" stroke-width="2"/><rect x="119" y="76" width="58" height="49" fill="#e9c68f" stroke="#bc7458" stroke-width="5"/><path d="m126 86 45 32m0-34-45 33" stroke="#bc7458" stroke-width="3"/>`,
  phone: `<rect x="96" y="16" width="88" height="169" rx="16" fill="#17474c" stroke="#13393c" stroke-width="5"/><rect x="104" y="31" width="72" height="136" rx="5" fill="#dfe9db"/><path d="m117 51 39 44-20 18 24 34" fill="none" stroke="#c77458" stroke-width="5" stroke-linecap="round"/><path d="M120 50 135 74l-18 18m39 3 16-5m-36 23-21 4" fill="none" stroke="#c77458" stroke-width="3"/><circle cx="140" cy="176" r="3" fill="#b9d4c3"/>`
}
const art = guide => `<svg viewBox="0 0 280 200" fill="none" aria-hidden="true" focusable="false">${artShapes[guide.art] || artShapes.button}</svg>`
const persistSaved = () => localStorage.setItem('theseus:saved', JSON.stringify([...saved]))
const progressKey = id => `theseus:progress:${id}`
const getProgress = id => new Set(readJson(progressKey(id), []))
const persistProgress = (id, set) => localStorage.setItem(progressKey(id), JSON.stringify([...set]))

const personalGuides = createPersonalGuides({
  content: $('#my-guides-content'), categories: categories.filter(name => name !== 'All'), escapeHtml
})

function renderFilters() {
  const create = (values, field, count) => values.map(value => {
    const label = field === 'level' && value !== 'All' ? difficultyMarkup(value) : value
    return `<label class="filter-check"><input type="radio" name="${field}" value="${value}" data-filter="${field}" ${state[field] === value ? 'checked' : ''}><span>${label}</span>${count && value !== 'All' ? `<small>${guides.filter(guide => guide.category === value).length}</small>` : ''}</label>`
  }).join('')
  $('#category-filters').innerHTML = create(categories, 'category', true)
  $('#action-filters').innerHTML = create(actions, 'action', false)
  $('#level-filters').innerHTML = create(levels, 'level', false)
  $('#video-filter').checked = state.videoOnly
  $('#sort-select').value = state.sort
}

function filteredGuides() {
  const term = state.query.toLowerCase()
  const result = guides.filter(guide => {
    if (state.category !== 'All' && guide.category !== state.category) return false
    if (state.action !== 'All' && guide.action !== state.action) return false
    if (state.level !== 'All' && guide.difficulty !== state.level) return false
    if (state.videoOnly && !guide.video) return false
    if (state.savedOnly && !saved.has(guide.id)) return false
    if (!term) return true
    return [guide.title, guide.summary, guide.category, guide.action, guide.intro, ...guide.parts].join(' ').toLowerCase().includes(term)
  })
  if (state.sort === 'quickest') result.sort((a, b) => a.minutes - b.minutes)
  else if (state.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title))
  else result.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title))
  return result
}

function card(guide) {
  const isSaved = saved.has(guide.id)
  return `<article class="guide-card"><div class="card-art art-${guide.category}">${art(guide)}<span class="art-label">${escapeHtml(guide.category.toUpperCase())} / ${escapeHtml(guide.action.toUpperCase())}</span><button class="card-save" type="button" data-save="${guide.id}" aria-label="${isSaved ? 'Remove' : 'Save'} ${escapeHtml(guide.title)} ${isSaved ? 'from' : 'to'} saved guides" aria-pressed="${isSaved}">${isSaved ? '♥' : '♡'}</button></div><div class="card-body"><div class="card-topline"><span>${escapeHtml(guide.action)} guide</span>${guide.video ? '<span class="video-pill">◉ Video</span>' : ''}</div><h3>${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.summary)}</p><div class="card-meta"><span>◷ ${guide.minutes} min</span>${difficultyMarkup(guide.difficulty)}</div><div class="card-bottom"><span>${escapeHtml(guide.category)}</span><a class="open-guide" href="#guide/${guide.id}" aria-label="Open guide: ${escapeHtml(guide.title)}">Open guide</a></div></div></article>`
}

function renderCatalog() {
  const results = filteredGuides()
  $('#guide-grid').innerHTML = results.map(card).join('')
  $('#guide-grid').hidden = results.length === 0
  $('#empty-state').hidden = results.length !== 0 || state.savedOnly
  $('#empty-saved').hidden = results.length !== 0 || !state.savedOnly
  $('#wider-search').hidden = results.length === 0 || state.savedOnly
  $('#guide-categories').hidden = state.savedOnly
  $('#result-title').textContent = state.savedOnly ? 'Saved guides' : state.query ? `Results for “${state.query}”` : state.category !== 'All' ? state.category : 'All guides'
  $('#result-count').textContent = `${results.length} ${results.length === 1 ? 'guide' : 'guides'}`
  $('#browse-summary-title').textContent = `${results.length} ${results.length === 1 ? 'guide' : 'guides'} ${state.query || state.category !== 'All' || state.action !== 'All' || state.level !== 'All' ? 'found' : 'ready to explore'}`
  $('#saved-count').textContent = String(saved.size)
  $('#saved-count').hidden = saved.size === 0
  document.querySelectorAll('#guide-categories [data-category]').forEach(button => button.setAttribute('aria-pressed', String(state.category === button.dataset.category)))
  $('#active-filters').innerHTML = [state.category !== 'All' && state.category, state.action !== 'All' && state.action, state.level !== 'All' && `Difficulty ${state.level}/5`, state.videoOnly && 'Video only', state.savedOnly && 'Saved'].filter(Boolean).map(label => `<span class="filter-chip">${escapeHtml(label)}</span>`).join('')
  const searchUrl = state.query ? `https://www.ifixit.com/Search?query=${encodeURIComponent(state.query)}` : 'https://www.ifixit.com/'
  $('#external-search').href = searchUrl
  $('#wider-search-link').href = searchUrl
  renderFilters()
}

function guideMarkup(guide) {
  const checked = getProgress(guide.id)
  const pct = Math.round(checked.size / guide.steps.length * 100)
  const videoContent = guide.video ? `<section class="video-panel" aria-labelledby="video-heading"><div class="video-panel-head"><div><h2 id="video-heading">See the repair</h2><p>${escapeHtml(guide.video.label)} · ${escapeHtml(guide.video.provider)}</p></div><span class="video-pill">Video guide</span></div><div class="video-stage" id="video-stage">${guide.video.id ? `<button type="button" class="video-play" data-play-video="${guide.id}" aria-label="Play ${escapeHtml(guide.video.label)}"><span class="play-circle" aria-hidden="true">▶</span><span>Play the video guide</span></button>` : `<a class="video-play" href="${escapeHtml(guide.video.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHtml(guide.video.label)} on ${escapeHtml(guide.video.provider)}"><span class="play-circle" aria-hidden="true">▶</span><span>Watch on ${escapeHtml(guide.video.provider)}</span></a>`}</div><div class="video-source">Video by ${escapeHtml(guide.video.provider)}. <a href="${escapeHtml(guide.video.url)}" target="_blank" rel="noopener noreferrer">Open original video</a> if playback is unavailable.</div></section>` : ''
  return `<div class="guide-shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span aria-hidden="true">/</span><a href="#guides">Guides</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(guide.category)}</span></nav><div class="guide-hero"><div class="guide-hero-copy"><span class="section-kicker">${escapeHtml(guide.category)} / ${escapeHtml(guide.action)}</span><h1 class="guide-title" id="guide-title" tabindex="-1">${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.summary)}</p><div class="guide-meta"><span>◷ ${guide.minutes} minutes</span>${difficultyMarkup(guide.difficulty)}<span>${guide.steps.length} steps</span></div><div class="guide-hero-actions"><button class="button button-primary" type="button" data-start-guide>Start guide</button><button class="button button-secondary" type="button" data-save="${guide.id}" aria-pressed="${saved.has(guide.id)}">${saved.has(guide.id) ? '♥ Saved' : '♡ Save guide'}</button><button class="button button-secondary" type="button" data-share>Copy link</button></div></div><div class="guide-hero-art art-${guide.category}" role="img" aria-label="Illustration of ${escapeHtml(guide.title.toLowerCase())}">${art(guide)}</div></div><div class="guide-main"><div class="guide-content"><section class="guide-panel" aria-labelledby="before-heading"><h2 id="before-heading">Before you begin</h2><p>${escapeHtml(guide.intro)}</p></section><section class="guide-panel guide-warning" aria-labelledby="safety-heading"><strong id="safety-heading">Safety first</strong><p>${escapeHtml(guide.safety)}</p></section>${videoContent}<section class="steps-panel" id="steps" aria-labelledby="steps-heading"><h2 id="steps-heading">Follow the path</h2><div class="progress-track" role="progressbar" aria-label="Guide progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-label" id="progress-label">${checked.size} of ${guide.steps.length} steps complete</div><ol class="step-list">${guide.steps.map(([title, text], index) => `<li class="step-item ${checked.has(index) ? 'done' : ''}"><input class="step-check" type="checkbox" data-step="${index}" data-guide-id="${guide.id}" aria-label="Mark step ${index + 1}, ${escapeHtml(title)}, complete" ${checked.has(index) ? 'checked' : ''}><div><div class="step-number">STEP ${String(index + 1).padStart(2, '0')}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></li>`).join('')}</ol></section><div class="guide-bottom"><a class="button button-secondary" href="${escapeHtml(guide.source.url)}" target="_blank" rel="noopener noreferrer">Read the full ${escapeHtml(guide.source.label)}</a><button class="button button-secondary" type="button" data-print>Print guide</button></div></div><aside class="guide-aside" aria-label="Tools, parts, and source"><div class="guide-aside-panel"><div class="aside-caption">GET READY</div><h2>What you'll need</h2><ul class="supply-list">${guide.tools.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div class="guide-aside-panel"><div class="aside-caption">FIND THE FIT</div><h2>Parts & materials</h2><ul class="supply-list">${guide.parts.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><a class="aside-link" href="https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(guide.partsQuery)}" target="_blank" rel="noopener noreferrer">Compare parts on eBay</a>${guide.category === 'Electronics' ? '<a class="aside-link" href="https://www.ifixit.com/Parts" target="_blank" rel="noopener noreferrer">Browse iFixit parts</a>' : ''}<p class="parts-note">These are search links, not exact-match listings. Check your model, measurements, and seller before ordering.</p></div><div class="guide-aside-panel source-panel"><div class="aside-caption">THE DEEPER GUIDE</div><h2>Expert source</h2><p class="parts-note">Our overview helps you start. The linked original has detailed photos and model-specific notes.</p><a class="aside-link" href="${escapeHtml(guide.source.url)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(guide.source.label)}</a></div></aside></div></div>`
}

function renderGuide(guide) {
  $('#guide-view').innerHTML = guideMarkup(guide)
  document.title = `${guide.title} — Theseus`
}

function route() {
  let hash
  try { hash = decodeURIComponent(location.hash.slice(1)) } catch { hash = '' }
  const guide = hash.startsWith('guide/') ? guideById.get(hash.slice(6)) : null
  const myGuides = hash === 'my-guides' || hash.startsWith('my-guides/')
  const standalone = ['settings', 'ai', 'parts-tools'].includes(hash)
  const view = myGuides ? 'my-guides' : standalone ? hash : guide ? 'guide' : hash === 'browse' || hash === 'catalog' ? 'browse' : hash === 'guides' || hash === 'saved' ? 'guides' : 'home'
  if ((hash === 'saved') !== state.savedOnly) {
    clearFilters()
    state.savedOnly = hash === 'saved'
    renderCatalog()
  }
  document.body.dataset.view = view
  $('#settings-view').hidden = hash !== 'settings'
  $('#ai-view').hidden = hash !== 'ai'
  $('#parts-tools-view').hidden = hash !== 'parts-tools'
  $('#my-guides-view').hidden = !myGuides
  document.querySelectorAll('.header-actions a').forEach(link => {
    const active = link.getAttribute('href') === `#${hash === 'saved' ? 'saved' : view === 'guide' ? 'guides' : view}`
    if (active) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
  if (myGuides) {
    $('#home-view').hidden = true
    $('#guide-view').hidden = true
    personalGuides.open(hash)
    window.scrollTo({ top: 0, behavior: 'instant' })
    return
  }
  personalGuides.close()
  if (hash === 'parts-tools') {
    $('#home-view').hidden = true
    $('#guide-view').hidden = true
    document.title = 'Parts & 3D — Theseus'
    window.scrollTo({ top: 0, behavior: 'instant' })
    $('#parts-tools-title').focus({ preventScroll: true })
    return
  }
  if (hash === 'ai') {
    $('#home-view').hidden = true
    $('#guide-view').hidden = true
    document.title = 'AI guide maker — Theseus'
    window.scrollTo({ top: 0, behavior: 'instant' })
    $('#ai-title').focus()
    return
  }
  if (hash === 'settings') {
    $('#home-view').hidden = true
    $('#guide-view').hidden = true
    document.title = 'Accessibility settings — Theseus'
    window.scrollTo({ top: 0, behavior: 'instant' })
    $('#settings-title').focus()
    return
  }
  if (guide) {
    $('#home-view').hidden = true
    $('#guide-view').hidden = false
    renderGuide(guide)
    window.scrollTo({ top: 0, behavior: 'instant' })
    $('#guide-title').focus?.()
  } else {
    $('#guide-view').hidden = true
    $('#home-view').hidden = false
    document.title = 'Theseus — keep the story, fix the thing'
    if (view === 'browse' || view === 'guides') window.scrollTo({ top: 0, behavior: 'instant' })
    else if (hash === 'method') requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView())
    else if (hash === 'home' || !hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }
}

function search(value) {
  Object.assign(state, { query: value.trim(), savedOnly: false })
  $('#header-query').value = state.query
  $('#browse-query').value = state.query
  renderCatalog()
  if (location.hash !== '#browse') location.hash = 'browse'
  else window.scrollTo({ top: 0, behavior: 'instant' })
}

function clearFilters() {
  Object.assign(state, { query: '', category: 'All', action: 'All', level: 'All', videoOnly: false, savedOnly: false, sort: 'featured' })
  $('#header-query').value = ''
  $('#browse-query').value = ''
  renderCatalog()
}

document.addEventListener('submit', event => {
  if (!['header-search', 'browse-search'].includes(event.target.id)) return
  event.preventDefault()
  search(event.target.querySelector('input[type="search"]').value)
})

document.addEventListener('change', event => {
  const target = event.target
  if (target.dataset.setting) {
    const key = target.dataset.setting
    preferences[key] = target.type === 'checkbox' ? target.checked : target.value
    savePreferences()
  }
  if (target.dataset.filter) {
    const filter = target.dataset.filter
    state[filter] = filter === 'level' && target.value !== 'All' ? Number(target.value) : target.value
    state.savedOnly = false
    renderCatalog()
  }
  if (target.id === 'video-filter') { state.videoOnly = target.checked; state.savedOnly = false; renderCatalog() }
  if (target.id === 'sort-select') { state.sort = target.value; renderCatalog() }
  if (target.dataset.step !== undefined) {
    const set = getProgress(target.dataset.guideId)
    const step = Number(target.dataset.step)
    target.checked ? set.add(step) : set.delete(step)
    persistProgress(target.dataset.guideId, set)
    target.closest('.step-item').classList.toggle('done', target.checked)
    const total = guideById.get(target.dataset.guideId).steps.length
    const pct = Math.round(set.size / total * 100)
    $('.progress-fill').style.width = `${pct}%`
    $('.progress-track').setAttribute('aria-valuenow', String(pct))
    $('#progress-label').textContent = `${set.size} of ${total} steps complete`
  }
})

document.addEventListener('click', async event => {
  const target = event.target.closest('button,a')
  if (!target) return
  if (target.dataset.quickSearch) search(target.dataset.quickSearch)
  if (target.dataset.preset) {
    const darkMode = preferences.darkMode
    Object.assign(preferences, preferenceDefaults)
    preferences.darkMode = darkMode
    if (target.dataset.preset === 'low-vision') Object.assign(preferences, { textSize: '150', highContrast: true, largeControls: true })
    if (target.dataset.preset === 'calm') Object.assign(preferences, { spaciousReading: true, calmLayout: true, reduceMotion: true })
    savePreferences(`${target.querySelector('strong')?.textContent || 'Preset'} settings applied and saved.`)
  }
  if (target.id === 'reset-accessibility') { Object.assign(preferences, preferenceDefaults); savePreferences('Original settings restored.') }
  if (target.dataset.category) {
    Object.assign(state, { category: target.dataset.category, query: '', action: 'All', level: 'All', videoOnly: false, savedOnly: false })
    $('#header-query').value = ''; $('#browse-query').value = ''
    renderCatalog(); location.hash = 'guides'; window.scrollTo({ top: 0, behavior: 'instant' })
  }
  if (target.dataset.save) {
    saved.has(target.dataset.save) ? saved.delete(target.dataset.save) : saved.add(target.dataset.save)
    persistSaved(); renderCatalog()
    const guide = guideById.get(target.dataset.save)
    if (!$('#guide-view').hidden && guide) {
      renderGuide(guide)
      $('#guide-view [data-save]').focus({ preventScroll: true })
    }
  }
  if (target.id === 'clear-filters') clearFilters()
  if (target.id === 'empty-reset') {
    clearFilters()
    location.hash = 'guides'
  }
  if (target.dataset.startGuide !== undefined) $('#steps')?.scrollIntoView()
  if (target.dataset.print !== undefined) window.print()
  if (target.dataset.share !== undefined) {
    try { await navigator.clipboard.writeText(location.href); target.textContent = 'Link copied'; window.setTimeout(() => { target.textContent = 'Copy link' }, 2200) }
    catch { target.textContent = 'Copy the address above' }
  }
  if (target.dataset.playVideo) {
    const guide = guideById.get(target.dataset.playVideo)
    if (!guide?.video?.id) return
    const stage = $('#video-stage')
    stage.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${guide.video.id}?autoplay=1" title="${escapeHtml(guide.video.label)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
  }
})

document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault()
    const searchField = document.body.dataset.view === 'browse' ? '#browse-query' : document.body.dataset.view === 'my-guides' && $('#my-guide-search') ? '#my-guide-search' : '#header-query'
    $(searchField).focus()
  }
})

$('#guide-categories').innerHTML = categories.map(name =>
  `<button type="button" data-category="${escapeHtml(name)}">${name === 'All' ? 'All categories' : escapeHtml(name)}</button>`
).join('')
renderCatalog()
applyPreferences()
initAiGuide({ escapeHtml })
initPartsTools()
window.addEventListener('hashchange', route)
route()

