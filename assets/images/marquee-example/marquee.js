/**
 * БЕГУЩАЯ СТРОКА (бесшовная, на любой ширине)
 *
 * Идея:
 *   1. В HTML лежит ОДИН логический набор контента.
 *   2. JS дублирует его столько раз, чтобы трек был минимум вдвое шире контейнера.
 *   3. Дописывает финальную копию ВСЕГО трека — тем самым гарантируем,
 *      что у трека есть две идентичные половины.
 *   4. CSS-анимация translateX(0) → translateX(-50%) проигрывается линейно
 *      и циклически: когда она доходит до -50%, мы видим начало второй
 *      половины, которая идентична началу трека → шов не виден.
 */
function setupMarquee(track) {
    if (!track) return;

    const run = () => {
        // 1. Сохраняем (или восстанавливаем) оригинал —
        //    нужно, чтобы на ресайзе пересчитывать с нуля.
        if (!track.dataset.orig) {
            track.dataset.orig = track.innerHTML;
        } else {
            track.innerHTML = track.dataset.orig;
        }

        const viewport = track.parentElement.offsetWidth;

        // 2. Дублируем оригинальный набор, пока трек не станет ≥ 2× viewport.
        //    safety — защита от бесконечного цикла на странном контенте.
        let safety = 0;
        while (track.scrollWidth < viewport * 2 && safety < 12) {
            track.insertAdjacentHTML('beforeend', track.dataset.orig);
            safety++;
        }

        // 3. Финальная полная копия. После этого шага у трека ровно
        //    две идентичные половины — для бесшовного translateX(-50%).
        track.insertAdjacentHTML('beforeend', track.innerHTML);

        // 4. Скорость: ~70 px/сек. Меняй, если хочется быстрее/медленнее.
        const PIXELS_PER_SECOND = 70;
        const half = track.scrollWidth / 2;
        const duration = Math.max(20, Math.round(half / PIXELS_PER_SECOND));
        track.style.animationDuration = `${duration}s`;
    };

    // Первый запуск
    run();

    // Пересчёт на ресайз — с дебаунсом, чтобы не дёргать на каждый пиксель
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(run, 200);
    });
}

// Находим все бегущие строки на странице и инициализируем
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.marquee__track').forEach(setupMarquee);
});
