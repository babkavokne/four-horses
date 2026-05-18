function setupRunningLine(track) {
  if (!track) return

  const run = () => {
    if (!track.dataset.orig) {
      track.dataset.orig = track.innerHTML
    } else {
      track.innerHTML = track.dataset.orig
    }

    const viewport = track.parentElement.offsetWidth

    let safety = 0
    while (track.scrollWidth < viewport * 2 && safety < 12) {
      track.insertAdjacentHTML('beforeend', track.dataset.orig)
      safety++
    }

    track.insertAdjacentHTML('beforeend', track.innerHTML)

    const half = track.scrollWidth / 2
    const duration = Math.max(20, Math.round(half / 70))
    track.style.animationDuration = `${duration}s`
  }

  run()

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(run, 200)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.running-line ul').forEach(setupRunningLine)
})
