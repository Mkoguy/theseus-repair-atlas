// The AI assistant only sends the form fields the visitor chooses to provide.
// The Gemini key never appears here; /api/guides runs on the site's server.
export function initAiGuide({ escapeHtml }) {
  const form = document.getElementById('ai-form')
  const status = document.getElementById('ai-status')
  const result = document.getElementById('ai-result')
  const submit = document.getElementById('ai-submit')
  const item = document.getElementById('ai-item')
  const problem = document.getElementById('ai-problem')
  let controller

  const list = values => `<ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`
  const searchLink = (label, base, query) => `<a href="${base}${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">${label}</a>`

  function render(guide, details) {
    const query = `${details.item} ${details.model} ${details.problem}`.trim().slice(0, 180)
    result.hidden = false
    result.innerHTML = `<div class="ai-result-head"><div><span class="ai-draft-label">AI DRAFT · VERIFY BEFORE REPAIRING</span><h2 id="ai-result-title" tabindex="-1">${escapeHtml(guide.title)}</h2><p>${escapeHtml(guide.overview)}</p></div><button class="button button-secondary" type="button" id="ai-print">Print draft</button></div>
      <div class="ai-warning"><strong>Stop and check safety</strong><p>${escapeHtml(guide.safety)}</p></div>
      <div class="ai-result-grid"><section class="ai-result-panel"><h3>First checks</h3>${list(guide.firstChecks)}</section><section class="ai-result-panel"><h3>Tools to gather</h3>${list(guide.tools)}</section></div>
      <section class="ai-result-panel"><h3>Suggested steps</h3><ol class="ai-steps">${guide.steps.map((step, index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.detail)}</p></div></li>`).join('')}</ol></section>
      <div class="ai-result-grid"><section class="ai-result-panel"><h3>Possible parts or materials</h3>${list(guide.parts)}<p>These are possibilities, not confirmed matches. Check the model and measurements.</p></section><section class="ai-result-panel"><h3>How to check your result</h3>${list(guide.verification)}<h3>When to get help</h3><p>${escapeHtml(guide.escalation)}</p></section></div>
      <div class="ai-searches"><strong>Research this exact item</strong><div>${searchLink('Find an expert guide', 'https://www.ifixit.com/Search?query=', query)}${searchLink('Compare possible parts', 'https://www.ebay.com/sch/i.html?_nkw=', `${details.item} ${details.model} repair parts`)}${searchLink('Search repair videos', 'https://www.youtube.com/results?search_query=', `${query} repair tutorial`)}</div><p>These links search other sites. They are not verified sources or exact matches.</p></div>
      <p class="ai-afterword">Need a more specific draft? Add the exact model, what you observed, or the tools you own above, then choose “Update starting guide.”</p>`
    submit.textContent = 'Update starting guide'
    document.getElementById('ai-result-title').focus()
  }

  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (!form.reportValidity()) return
    controller?.abort()
    controller = new AbortController()
    const details = Object.fromEntries(new FormData(form).entries())
    submit.disabled = true
    submit.textContent = 'Building your guide…'
    status.textContent = 'Thinking through the fault and safety checks. This may take a moment.'
    try {
      const response = await fetch('/api/guides', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(details), signal: controller.signal
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'The guide maker is unavailable right now. Try again later.')
      render(payload.guide, details)
      status.textContent = 'Your draft is ready. Review its safety check before following any step.'
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = error.message === 'Failed to fetch'
        ? 'The guide maker needs the hosted site and a configured Gemini key. The WebStorm file preview cannot generate a guide.'
        : error.message
    } finally {
      submit.disabled = false
      if (submit.textContent === 'Building your guide…') submit.textContent = 'Create my starting guide'
    }
  })

  result.addEventListener('click', event => { if (event.target.id === 'ai-print') window.print() })
  document.getElementById('generate-guide').addEventListener('click', () => {
    item.value = ''
    problem.value = document.getElementById('header-query').value.trim()
  })
}
