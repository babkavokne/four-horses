/**
 * Карусель карточек
 *
 * Опции:
 *   trackSelector     — селектор контейнера с карточками внутри root
 *   prevSelector      — селектор кнопки "назад"
 *   nextSelector      — селектор кнопки "вперёд"
 *   indicatorSelector — селектор контейнера индикатора (точки / счётчик)
 *   breakpoints       — [{ minWidth, perPage }, ...] карточек на страницу
 *   loop              — bool, бесконечная карусель (клоны страниц по краям)
 *   autoplay          — bool, автопереключение
 *   interval          — мс, период автопереключения
 *   duration          — мс, длительность анимации сдвига
 *   indicator         — 'dots' | 'counter'
 */
class Carousel {
  constructor(rootEl, options = {}) {
    if (!rootEl) throw new Error('Carousel: rootEl is required')
    this.root = rootEl

    const trackSel =
      options.trackSelector || '.carousel__cards, .carousel__track'
    const prevSel =
      options.prevSelector || '.carousel__arrow--previous, .carousel__previous'
    const nextSel =
      options.nextSelector || '.carousel__arrow--next, .carousel__next'
    const indSel = options.indicatorSelector || '.carousel__indicator'

    this.track = rootEl.querySelector(trackSel)
    this.prevBtn = rootEl.querySelector(prevSel)
    this.nextBtn = rootEl.querySelector(nextSel)
    this.indicatorEl = rootEl.querySelector(indSel)

    if (!this.track)
      throw new Error(`Carousel: track not found by "${trackSel}"`)
    if (!this.prevBtn)
      throw new Error(`Carousel: prev not found by "${prevSel}"`)
    if (!this.nextBtn)
      throw new Error(`Carousel: next not found by "${nextSel}"`)
    if (!this.indicatorEl)
      throw new Error(`Carousel: indicator not found by "${indSel}"`)

    this.breakpoints = options.breakpoints || [
      { minWidth: 0, perPage: 1 },
      { minWidth: 600, perPage: 2 },
      { minWidth: 960, perPage: 3 },
      { minWidth: 1200, perPage: 4 },
    ]

    this.loop = options.loop ?? false
    this.autoplay = options.autoplay ?? false
    this.interval = options.interval ?? 4000
    this.duration = options.duration ?? 400
    this.indicator = options.indicator ?? 'dots'

    this.currentPage = 0
    this.cardsPerPage = 1
    this.totalPages = 1
    this.originalCards = Array.from(this.track.children)
    this._autoplayId = null
    this._isAnimating = false

    this.track.style.willChange = 'transform'

    this._bindEvents()
  }

  _calcCardsPerPage() {
    const w = window.innerWidth
    const bp = this.breakpoints
      .filter((b) => w >= b.minWidth)
      .sort((a, b) => b.minWidth - a.minWidth)[0]
    return bp ? bp.perPage : 1
  }

  _rebuildTrack() {
    this.cardsPerPage = this._calcCardsPerPage()
    this.totalPages = Math.max(
      1,
      Math.ceil(this.originalCards.length / this.cardsPerPage),
    )

    this.track.innerHTML = ''
    const canLoop = this.loop && this.totalPages > 1

    if (canLoop) {
      const lastPageStart = (this.totalPages - 1) * this.cardsPerPage
      for (let i = lastPageStart; i < this.originalCards.length; i++) {
        this.track.appendChild(this.originalCards[i].cloneNode(true))
      }
      const tailCount = this.originalCards.length - lastPageStart
      for (let i = 0; i < this.cardsPerPage - tailCount; i++) {
        this.track.appendChild(this.originalCards[i].cloneNode(true))
      }
    }

    this.originalCards.forEach((c) => this.track.appendChild(c))

    if (canLoop) {
      for (let i = 0; i < this.cardsPerPage; i++) {
        this.track.appendChild(
          this.originalCards[i % this.originalCards.length].cloneNode(true),
        )
      }
    }

    if (this.currentPage > this.totalPages - 1) {
      this.currentPage = this.totalPages - 1
    }
  }

  _trackPos(page) {
    return this.loop && this.totalPages > 1 ? page + 1 : page
  }

  _move(trackPos, animated) {
    this.track.style.transition = animated
      ? `transform ${this.duration}ms ease`
      : 'none'
    this.track.style.transform = `translateX(-${trackPos * 100}%)`
  }

  _renderIndicator() {
    this.indicatorEl.innerHTML = ''

    if (this.indicator === 'counter') {
      const span = document.createElement('span')
      span.className = 'carousel__counter'
      this.indicatorEl.appendChild(span)
      return
    }

    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'carousel__dot'
      dot.setAttribute('aria-label', `Страница ${i + 1}`)
      dot.addEventListener('click', () => {
        this.goTo(i)
        this._resetAutoplay()
      })
      this.indicatorEl.appendChild(dot)
    }
  }

  _updateUI() {
    if (this.loop && this.totalPages > 1) {
      this.prevBtn.classList.remove('is-disabled')
      this.nextBtn.classList.remove('is-disabled')
    } else {
      this.prevBtn.classList.toggle('is-disabled', this.currentPage === 0)
      this.nextBtn.classList.toggle(
        'is-disabled',
        this.currentPage >= this.totalPages - 1,
      )
    }

    if (this.indicator === 'counter') {
      const total = this.originalCards.length
      const visible = Math.min(
        (this.currentPage + 1) * this.cardsPerPage,
        total,
      )
      const span = this.indicatorEl.querySelector('.carousel__counter')
      if (span) span.innerHTML = `<b>${visible}</b> / ${total}`
    } else {
      Array.from(this.indicatorEl.children).forEach((dot, i) => {
        dot.classList.toggle('carousel__dot--active', i === this.currentPage)
      })
    }
  }

  _recalc() {
    this._rebuildTrack()
    this._renderIndicator()
    this._move(this._trackPos(this.currentPage), false)
    this._updateUI()
  }

  goTo(index) {
    this.currentPage = Math.max(0, Math.min(index, this.totalPages - 1))
    this._move(this._trackPos(this.currentPage), true)
    this._updateUI()
  }

  next() {
    if (this._isAnimating) return

    if (!this.loop || this.totalPages <= 1) {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++
        this._move(this._trackPos(this.currentPage), true)
        this._updateUI()
      }
      return
    }

    if (this.currentPage === this.totalPages - 1) {
      this._isAnimating = true
      this._move(this.totalPages + 1, true)
      const onEnd = () => {
        this.track.removeEventListener('transitionend', onEnd)
        this.currentPage = 0
        this._move(this._trackPos(0), false)
        void this.track.offsetWidth
        this._isAnimating = false
        this._updateUI()
      }
      this.track.addEventListener('transitionend', onEnd)
    } else {
      this.currentPage++
      this._move(this._trackPos(this.currentPage), true)
      this._updateUI()
    }
  }

  prev() {
    if (this._isAnimating) return

    if (!this.loop || this.totalPages <= 1) {
      if (this.currentPage > 0) {
        this.currentPage--
        this._move(this._trackPos(this.currentPage), true)
        this._updateUI()
      }
      return
    }

    if (this.currentPage === 0) {
      this._isAnimating = true
      this._move(0, true)
      const onEnd = () => {
        this.track.removeEventListener('transitionend', onEnd)
        this.currentPage = this.totalPages - 1
        this._move(this._trackPos(this.totalPages - 1), false)
        void this.track.offsetWidth
        this._isAnimating = false
        this._updateUI()
      }
      this.track.addEventListener('transitionend', onEnd)
    } else {
      this.currentPage--
      this._move(this._trackPos(this.currentPage), true)
      this._updateUI()
    }
  }

  startAutoplay() {
    this.stopAutoplay()
    if (!this.autoplay) return
    this._autoplayId = setInterval(() => this.next(), this.interval)
  }

  stopAutoplay() {
    if (this._autoplayId) clearInterval(this._autoplayId)
    this._autoplayId = null
  }

  _resetAutoplay() {
    if (this.autoplay) this.startAutoplay()
  }

  setAutoplay(on) {
    this.autoplay = on
    on ? this.startAutoplay() : this.stopAutoplay()
  }

  setLoop(on) {
    this.loop = on
    this._recalc()
    this._resetAutoplay()
  }

  setIndicator(type) {
    if (type !== 'dots' && type !== 'counter') return
    this.indicator = type
    this._renderIndicator()
    this._updateUI()
  }

  _bindEvents() {
    this.nextBtn.addEventListener('click', () => {
      this.next()
      this._resetAutoplay()
    })
    this.prevBtn.addEventListener('click', () => {
      this.prev()
      this._resetAutoplay()
    })

    this.root.addEventListener('mouseenter', () => this.stopAutoplay())
    this.root.addEventListener('mouseleave', () => this._resetAutoplay())

    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.stopAutoplay() : this._resetAutoplay()
    })

    let t
    window.addEventListener('resize', () => {
      clearTimeout(t)
      t = setTimeout(() => this._recalc(), 100)
    })
  }

  init() {
    this._recalc()
    this.startAutoplay()
    return this
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const stages = document.getElementById('carousel')
  if (stages) {
    new Carousel(stages, {
      trackSelector: '#track',
      prevSelector: '#prevBtn',
      nextSelector: '#nextBtn',
      indicatorSelector: '#indicator',
      loop: false,
      autoplay: false,
      indicator: 'dots',
    }).init()
  }

  const participants = document.getElementById('participants-carousel')
  if (participants) {
    new Carousel(participants, {
      trackSelector: '#participants-track',
      prevSelector: '#participants-prevBtn',
      nextSelector: '#participants-nextBtn',
      indicatorSelector: '#participants-indicator',
      loop: true,
      autoplay: true,
      interval: 4000,
      indicator: 'counter',
    }).init()
  }
})
