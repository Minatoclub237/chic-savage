import './style.css'
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

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const target = $(a.getAttribute('href'))
  if (!target) return
  e.preventDefault()
  closeMenu()
  lenis.scrollTo(target, { offset: 0, duration: 1.4 })
}))

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

/* ---------- about lead: split into words ---------- */
const lead = $('.about-lead')
lead.innerHTML = lead.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ')

const mm = gsap.matchMedia()

mm.add({ desktop: '(min-width: 1001px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { desktop, motion } = ctx.conditions
  if (!motion) return

  /* hero intro: side cards slide in, wordmark sharpens, nav drops */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-model', { opacity: 0, scale: 1.04, duration: 1.1 }, 0)
    .from('.stat-left', { x: -260, opacity: 0, duration: 1 }, 0.1)
    .from('.stat-right', { x: 260, opacity: 0, duration: 1 }, 0.1)
    .from('.hero-word span', { opacity: 0, scale: 1.12, filter: 'blur(14px)', duration: 1.1 }, 0.35)
    .from('.btn-hero', { x: 60, opacity: 0, duration: 0.8 }, 0.55)
    .from('.nav', { y: -30, opacity: 0, duration: 0.8 }, 0.7)

  /* hero parallax on leave */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  gsap.to('.hero-word', { yPercent: 70, ease: 'none', scrollTrigger: heroST })
  gsap.to('.hero-model', { y: 90, ease: 'none', scrollTrigger: heroST })
  gsap.to('.stat, .btn-hero', { y: -60, ease: 'none', scrollTrigger: heroST })

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

  /* working process: a deck of cards deals out into the grid */
  const tiles = $$('.step')
  if (desktop) {
    const cols = 4
    const pos = () => tiles.map((t) => ({ x: t.offsetLeft, w: t.offsetWidth }))
    let p = pos()
    const centerX = () => (tiles[0].parentElement.clientWidth - p[0].w) / 2
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.steps', start: 'top 95%', end: 'top 22%', scrub: 0.6,
        invalidateOnRefresh: true, onRefreshInit: () => { p = pos() },
      },
    })
    tiles.forEach((t, i) => {
      const c = i % cols
      t.style.zIndex = 10 - c
      tl.fromTo(t,
        { x: () => centerX() - p[i].x + c * 8, scale: 1 - c * 0.035 },
        { x: () => p[i - c].x - p[i].x + c * 8, duration: 0.3 }, 0.12)
      tl.to(t, { x: 0, scale: 1, duration: 0.45, ease: 'power2.inOut' }, 0.47 + c * 0.08)
    })
    tl.from('.steps', { opacity: 0, y: 40, duration: 0.12 }, 0)
  } else {
    gsap.from(tiles, { y: 50, opacity: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 90%', end: 'top 40%', scrub: true } })
  }

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
  const priceTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: desktop
      ? { trigger: '.pricing', start: 'top top', end: '+=110%', pin: true, scrub: 0.6, anticipatePin: 1 }
      : { trigger: '.pricing', start: 'top 80%', end: 'top 10%', scrub: true },
  })
  priceTl
    .fromTo('.price-photo', { y: () => innerHeight * 0.22, scale: 2.3, rotate: -14 }, { y: 0, scale: 1, rotate: -5, duration: 1, ease: 'power1.inOut' })
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
  gsap.from('.gal-grid figure', {
    scale: 0.32, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: '.gal-grid', start: 'top 100%', end: 'top 30%', scrub: true },
  })

  /* footer: letters rise one by one */
  gsap.from('.foot-word .ch', {
    yPercent: 70, opacity: 0, rotate: 10, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.foot', start: 'top 75%', end: 'bottom bottom', scrub: true },
  })
})

/* reduced motion: show the words fully */
mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set('.about-lead .w', { opacity: 1 }) })
