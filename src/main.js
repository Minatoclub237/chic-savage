import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: 0.09 })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)

/* ---------- loader: brand video, then wipe up onto the hero ---------- */
history.scrollRestoration = 'manual'
scrollTo(0, 0)
lenis.stop()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })))
const loader = $('#loader')
const intro = $('#loader video')
let leaving = false
function leaveLoader() {
  if (leaving) return
  leaving = true
  Promise.race([Promise.all([pageLoaded, document.fonts.ready]), wait(2500)]).then(() => {
    gsap.to(loader, {
      clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'power4.inOut',
      onComplete: () => { loader.remove(); document.documentElement.classList.remove('is-loading'); lenis.start(); ScrollTrigger.refresh() },
    })
  })
}
intro.addEventListener('ended', leaveLoader)
$('.loader-skip').addEventListener('click', leaveLoader)
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { intro.pause(); wait(600).then(leaveLoader) }
else intro.play().catch(() => wait(1500).then(leaveLoader)) // autoplay refused: show the poster, then go
wait(7500).then(leaveLoader) // slow network safety net

/* ---------- anchors; logo / « Accueil » land on the fully built hero ---------- */
let heroEnd = null
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href')
  const target = $(href)
  if (!target) return
  e.preventDefault()
  closeMenu()
  if (a.dataset.soin) form.elements.soin.value = a.dataset.soin
  lenis.scrollTo(href === '#top' ? (heroEnd ? heroEnd() : 0) : target, { offset: 0, duration: 1.4 })
}))

/* ---------- rendez-vous: e-mail (FormSubmit) or WhatsApp ---------- */
const form = $('#rdv-form')
const MAIL = 'nicoleosel@gmail.com'
const WA = '596696317356'
const errorBox = $('.f-error', form)
const dateInput = form.elements.date
const lateSlot = $('option.late', form)
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Martinique' }).format(new Date())
dateInput.min = today
const dayOf = (iso) => new Date(`${iso}T12:00:00`).getDay()
const frDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

dateInput.addEventListener('change', () => {
  const d = dateInput.value ? dayOf(dateInput.value) : -1
  dateInput.setCustomValidity(d === 0 ? 'L’institut est fermé le dimanche : choisissez un autre jour.' : '')
  lateSlot.disabled = d === 3 // le mercredi, fermeture à 16 h
  if (lateSlot.disabled && lateSlot.selected) form.elements.creneau.value = ''
})

function check() {
  form.classList.add('was-validated')
  errorBox.hidden = true
  if (form.checkValidity()) return true
  const bad = form.querySelector(':invalid')
  errorBox.textContent = bad.validationMessage || 'Merci de compléter les champs obligatoires.'
  errorBox.hidden = false
  bad.focus()
  return false
}

function summary() {
  const f = form.elements
  return [
    `Nom : ${f.nom.value.trim()}`,
    `Téléphone : ${f.telephone.value.trim()}`,
    f.email.value.trim() && `E-mail : ${f.email.value.trim()}`,
    `Soin : ${f.soin.value}`,
    `Date souhaitée : ${frDate(f.date.value)} — ${f.creneau.value}`,
    f.message.value.trim() && `Message : ${f.message.value.trim()}`,
  ].filter(Boolean)
}

$('#rdv-wa').addEventListener('click', () => {
  if (!check()) return
  const text = ['Bonjour Chic Savage Beauty ✨', 'Je souhaite prendre rendez-vous :', ...summary().map((l) => `• ${l}`)].join('\n')
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!check()) return
  if (form.elements._honey.value) return
  const submit = $('button[type="submit"]', form)
  submit.disabled = true
  const f = form.elements
  const payload = {
    _subject: `Demande de rendez-vous — ${f.nom.value.trim()} — ${f.soin.value}`,
    _template: 'table',
    _captcha: 'false',
    Nom: f.nom.value.trim(),
    Téléphone: f.telephone.value.trim(),
    email: f.email.value.trim() || undefined,
    Soin: f.soin.value,
    'Date souhaitée': frDate(f.date.value),
    Créneau: f.creneau.value,
    Message: f.message.value.trim() || '—',
  }
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${MAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || res.status)
    $('.f-actions', form).hidden = true
    $('.f-success', form).hidden = false
    form.reset()
    form.classList.remove('was-validated')
  } catch {
    const body = encodeURIComponent(`Bonjour,\n\nJe souhaite prendre rendez-vous :\n${summary().join('\n')}\n`)
    errorBox.innerHTML = `L’envoi n’a pas abouti. Vous pouvez <a href="mailto:${MAIL}?subject=${encodeURIComponent('Demande de rendez-vous')}&body=${body}">envoyer la demande par e-mail</a> ou utiliser le bouton WhatsApp.`
    errorBox.hidden = false
  } finally {
    submit.disabled = false
  }
})

/* ---------- scroll cue: glides through the hero build ---------- */
$('.scroll-cue').addEventListener('click', () => lenis.scrollTo(heroEnd ? heroEnd() : '#about', { duration: 2.2 }))

/* ---------- legal dialogs ---------- */
$$('[data-dialog]').forEach((b) => b.addEventListener('click', () => $(`#${b.dataset.dialog}`).showModal()))
$$('dialog.legal').forEach((d) => {
  $('.legal-close', d).addEventListener('click', () => d.close())
  d.addEventListener('click', (e) => { if (e.target === d) d.close() })
})

/* ---------- opening hours: today + open now (heure de Martinique) ---------- */
const now = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Martinique', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map((p) => [p.type, p.value]))
const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(now.weekday)
const minutes = +now.hour * 60 + +now.minute
const closing = day === 0 ? 0 : day === 3 ? 16 * 60 : 18 * 60
const isOpen = minutes >= 9 * 60 && minutes < closing
$(`.hours li[data-day="${day}"]`)?.classList.add('is-today')
const badge = $('.open-now')
badge.textContent = isOpen ? 'Ouvert' : 'Fermé'
badge.classList.toggle('is-closed', !isOpen)
badge.hidden = false

/* ---------- mobile menu ---------- */
const burger = $('.burger')
const menu = $('.mobile-menu')
function closeMenu() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false') }
burger.addEventListener('click', () => {
  menu.hidden = !menu.hidden
  burger.setAttribute('aria-expanded', String(!menu.hidden))
})

/* ---------- wordmarks fill their width ---------- */
function fit(el, ratio) {
  const span = el.firstElementChild || el
  el.style.fontSize = '100px'
  const w = span.offsetWidth
  el.style.fontSize = `${(100 * el.clientWidth * ratio) / w}px`
}
const heroWord = $('.hero-word')
const footWord = $('.foot-word')
footWord.innerHTML = `<span>${[...footWord.textContent].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`
const fitAll = () => { fit(heroWord, innerWidth > 1000 ? 0.88 : 0.92); fit(footWord, 1) }
fitAll()
document.fonts.ready.then(() => { fitAll(); ScrollTrigger.refresh() })
addEventListener('resize', fitAll)

gsap.set('.hero-model', { xPercent: -46 })

/* ---------- about lead: split into words ---------- */
const lead = $('.about-lead')
lead.innerHTML = lead.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ')

const mm = gsap.matchMedia()

mm.add({ desktop: '(min-width: 1001px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { desktop, motion } = ctx.conditions
  if (!motion) return

  /* hero: built by the scroll — pinned, cards slide in from the edges, wordmark sharpens */
  const left = $('.stat-left')
  const right = $('.stat-right')
  const heroTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=110%', pin: true, scrub: 0.8, invalidateOnRefresh: true },
  })
  heroTl
    .to('.scroll-cue', { opacity: 0, y: 20, duration: 0.12 }, 0)
    .fromTo('.hero-model', { scale: 1.08 }, { scale: 1, duration: 1 }, 0)
    .fromTo(left, { x: () => -(left.offsetLeft + left.offsetWidth * 0.8) }, { x: 0, duration: 0.4, ease: 'power2.out' }, 0.04)
    .fromTo(right, { x: () => innerWidth - right.offsetLeft - right.offsetWidth * 0.2 }, { x: 0, duration: 0.4, ease: 'power2.out' }, 0.04)
    .fromTo('.hero-word span', { opacity: 0, scale: 1.15, filter: 'blur(16px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.4 }, 0.3)
    .fromTo('.hero-ctas > *', { x: 160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.08 }, 0.5)
    .to({}, { duration: 0.2 })
  heroEnd = () => heroTl.scrollTrigger.end

  /* section heads */
  $$('.head, .price-head').forEach((h) => gsap.from(h.children, {
    y: 36, opacity: 0, stagger: 0.12, ease: 'none',
    scrollTrigger: { trigger: h, start: 'top 92%', end: 'top 65%', scrub: true },
  }))

  /* about: words light up with scroll */
  gsap.to('.about-lead .w', {
    opacity: 1, stagger: 0.05, ease: 'none',
    scrollTrigger: { trigger: '.about-lead', start: 'top 85%', end: 'bottom 45%', scrub: true },
  })
  gsap.from('.collage > *', { y: 60, opacity: 0, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.about-bottom', start: 'top 95%', end: 'top 60%', scrub: true } })
  gsap.from('.about-card', { x: 120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.about-bottom', start: 'top 95%', end: 'top 60%', scrub: true } })
  gsap.from('.about-cta .btn', { x: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.about-bottom', start: 'top 95%', end: 'top 60%', scrub: true } })
  gsap.fromTo('.petal', { y: 80, rotate: -25 }, { y: -60, rotate: 15, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } })

  /* working process: a deck of cards deals out into the grid (4 columns on desktop, 2 on mobile) */
  const grid = $('.steps')
  const tiles = $$('.step')
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  const pos = () => tiles.map((t) => ({ x: t.offsetLeft, w: t.offsetWidth }))
  let p = pos()
  const centerX = () => (grid.clientWidth - p[0].w) / 2
  const deck = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: grid, start: desktop ? 'top 95%' : 'top 90%', end: desktop ? 'top 22%' : 'top 15%', scrub: 0.6,
      invalidateOnRefresh: true, onRefreshInit: () => { p = pos() },
    },
  })
  tiles.forEach((t, i) => {
    const c = i % cols
    t.style.zIndex = 10 - c
    deck.fromTo(t,
      { x: () => centerX() - p[i].x + c * 8, scale: 1 - c * 0.035 },
      { x: () => p[i - c].x - p[i].x + c * 8, duration: 0.3 }, 0.12)
    deck.to(t, { x: 0, scale: 1, duration: 0.45, ease: 'power2.inOut' }, 0.47 + c * 0.08)
  })
  deck.from(grid, { opacity: 0, y: 40, duration: 0.12 }, 0)

  /* services: panel content reveals, image parallax */
  $$('.serv').forEach((card) => {
    gsap.from($$('.rv', card), {
      y: 26, opacity: 0, stagger: 0.18, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top 80%', end: 'top 25%', scrub: true },
    })
    gsap.fromTo($('.serv-img img', card), { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  })

  /* pricing: the tilted photo lands, the band sweeps open, rows rise */
  const photo = $('.price-photo')
  const photoToCenter = () => photo.parentElement.clientWidth / 2 - (photo.offsetLeft + photo.offsetWidth / 2)
  const priceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.pricing', start: 'top top', end: '+=110%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
  })
  priceTl
    .fromTo(photo, { x: photoToCenter, y: () => innerHeight * 0.22, scale: desktop ? 2.3 : 2.6, rotate: -14 }, { x: 0, y: 0, scale: 1, rotate: -5, duration: 1, ease: 'power1.inOut' })
    .from('.price-band', { scaleX: 0, duration: 0.5 }, 0.75)
    .from('.pricing .row', { y: 50, opacity: 0, stagger: 0.12, duration: 0.4 }, 0.85)

  /* testimonials: side cards slide in from the edges, out of focus */
  const tST = { trigger: '.testi-grid', start: 'top 95%', end: 'top 35%', scrub: true }
  gsap.from('.t-left .t-card', { x: -240, opacity: 0, filter: 'blur(12px)', stagger: 0.15, ease: 'none', scrollTrigger: tST })
  gsap.from('.t-right .t-card', { x: 240, opacity: 0, filter: 'blur(12px)', stagger: 0.15, ease: 'none', scrollTrigger: tST })
  gsap.from('.t-photo', { scale: 0.88, ease: 'none', scrollTrigger: tST })

  /* faq: image wipes open, questions slide in from the right */
  const fST = { trigger: '.faq-grid', start: 'top 92%', end: 'top 40%', scrub: true }
  gsap.fromTo('.faq-img', { clipPath: 'inset(0% 92% 0% 0% round 10px)' }, { clipPath: 'inset(0% 0% 0% 0% round 10px)', ease: 'none', scrollTrigger: fST })
  gsap.from('.faq-list details', { x: (i) => 160 + i * 60, opacity: 0, stagger: 0.08, ease: 'none', scrollTrigger: fST })
  gsap.from('.faq-side h3, .faq-side .btn', { y: 30, opacity: 0, stagger: 0.15, ease: 'none', scrollTrigger: fST })

  /* gallery: photos grow from their centres */
  gsap.from('.gal-grid > a', {
    scale: 0.32, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: '.gal-grid', start: 'top 100%', end: 'top 30%', scrub: true },
  })

  /* calls to action rise in after their section */
  $$('.section-cta').forEach((c) => gsap.from(c.children, {
    y: 30, opacity: 0, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: c, start: 'top 95%', end: 'top 75%', scrub: true },
  }))

  /* rendez-vous: info card from the left, form from the right */
  const rST = { trigger: '.rdv-grid', start: 'top 95%', end: 'top 45%', scrub: true }
  gsap.from('.rdv-info', { x: -160, opacity: 0, ease: 'none', scrollTrigger: rST })
  gsap.from('.rdv-form', { x: 160, opacity: 0, ease: 'none', scrollTrigger: rST })

  /* footer: letters rise one by one */
  gsap.from('.foot-word .ch', {
    yPercent: 70, opacity: 0, rotate: 10, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.foot', start: 'top 75%', end: 'bottom bottom', scrub: true },
  })
})

/* reduced motion: show the words fully */
mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set('.about-lead .w', { opacity: 1 }) })
