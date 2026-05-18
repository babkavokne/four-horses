/**
 * Опции:
 *   breakpoints — [{ minWidth, perPage }, ...]
 *   loop        — bool, бесконечная карусель (клоны страниц по краям)
 *   autoplay    — bool, автопереключение
 *   interval    — мс, период автопереключения
 *   indicator   — 'dots' | 'counter'
 *   ids         — {string: string}, id элементов, по которым определяем основные элементы каруселей
 */
class Carousel {
  constructor(rootEl, options = {}) {
    this.root = rootEl
    this.track = rootEl.querySelector(`${options.ids?.track || '#track'}`)
    this.prevBtn = rootEl.querySelector(`${options.ids?.prevBtn || '#prevBtn'}`)
    this.nextBtn = rootEl.querySelector(`${options.ids?.nextBtn || '#nextBtn'}`)
    this.indicatorEl = rootEl.querySelector(
      `${options.ids?.indicator || '#indicator'}`,
    )

    this.breakpoints = options.breakpoints || [
      { minWidth: 0, perPage: 1 },
      { minWidth: 600, perPage: 2 },
      { minWidth: 960, perPage: 3 },
      { minWidth: 1200, perPage: 4 },
    ]

    this.loop = options.loop ?? false
    this.autoplay = options.autoplay ?? false
    this.interval = options.interval ?? 4000
    this.indicator = options.indicator ?? 'dots'

    this.currentPage = 0
    this.cardsPerPage = 1
    this.totalPages = 1
    this.originalCards = []
    this._autoplayId = null
    this._isAnimating = false

    this.originalCards = Array.from(this.track.children)

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

  _setTransform(animated) {
    this.track.classList.toggle('carousel__track--animated', animated)
    this.track.style.transform = `translateX(-${this._trackPos(this.currentPage) * 100}%)`
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
      this.prevBtn.disabled = false
      this.nextBtn.disabled = false
    } else {
      this.prevBtn.disabled = this.currentPage === 0
      this.nextBtn.disabled = this.currentPage >= this.totalPages - 1
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
    this._setTransform(false)
    this._updateUI()
  }

  goTo(index) {
    this.currentPage = Math.max(0, Math.min(index, this.totalPages - 1))
    this._setTransform(true)
    this._updateUI()
  }

  _moveTo(trackPos, animated) {
    this.track.classList.toggle('carousel__track--animated', animated)
    this.track.style.transform = `translateX(-${trackPos * 100}%)`
  }

  next() {
    if (this._isAnimating) return

    if (!this.loop || this.totalPages <= 1) {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++
        this._setTransform(true)
        this._updateUI()
      }
      return
    }

    if (this.currentPage === this.totalPages - 1) {
      this._isAnimating = true
      this._moveTo(this.totalPages + 1, true)
      const onEnd = () => {
        this.track.removeEventListener('transitionend', onEnd)
        this.currentPage = 0
        this._moveTo(this._trackPos(0), false)
        void this.track.offsetWidth
        this._isAnimating = false
        this._updateUI()
      }
      this.track.addEventListener('transitionend', onEnd)
    } else {
      this.currentPage++
      this._setTransform(true)
      this._updateUI()
    }
  }

  prev() {
    if (this._isAnimating) return

    if (!this.loop || this.totalPages <= 1) {
      if (this.currentPage > 0) {
        this.currentPage--
        this._setTransform(true)
        this._updateUI()
      }
      return
    }

    if (this.currentPage === 0) {
      this._isAnimating = true
      this._moveTo(0, true)
      const onEnd = () => {
        this.track.removeEventListener('transitionend', onEnd)
        this.currentPage = this.totalPages - 1
        this._moveTo(this._trackPos(this.totalPages - 1), false)
        void this.track.offsetWidth
        this._isAnimating = false
        this._updateUI()
      }
      this.track.addEventListener('transitionend', onEnd)
    } else {
      this.currentPage--
      this._setTransform(true)
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
  }
}

const carousel = new Carousel(document.getElementById('carousel'))
carousel.init()

// const participantsCarousel = new Carousel(
//   document.getElementById('participants-carousel', {
//     ids: {
//       track: '#participants-track',
//       prevBtn: '#participants-prevBtn',
//       nextBtn: '#participants-nextBtn',
//       indicator: '#participants-indicator',
//     },
//   }),
// )
// participantsCarousel.init()
