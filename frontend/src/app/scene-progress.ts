/**
 * Fan -> grid scroll scene. Loaded on demand, only on wide screens without a
 * reduced-motion preference. Drives a single scalar `--p` (0..1) on `root`;
 * the stylesheet turns it into each featured card's transform, offset by the
 * distance between the card's grid place and its hero slot (`--dx/--dy/--s/--r`).
 * The `scene` classes are applied here, in the same task as the first
 * measurement, so the cards are never hidden while the scene is not running.
 * Returns a function that undoes everything.
 */
export function startScene(root: HTMLElement): () => void {
  const hero = root.querySelector<HTMLElement>('[data-hero]');
  const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-fan-slot]'));
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-fan-card]'));
  if (!hero || !cards.length) return () => {};

  const cls = root.classList;
  const fine = matchMedia('(pointer: fine)').matches;
  let heroH = 1;
  let p = -1;
  let frame = 0;
  let measureFrame = 0;
  let stopped = false;

  /**
   * Measures the natural (untransformed) boxes. `scene-measure` removes the
   * transform and `scene-still` cancels transitions and pauses animations, so a
   * running transition cannot leak an intermediate box into the measurement.
   * `scene-still` is kept for one style flush after `scene-measure` goes, so
   * restoring the transform does not start a transition from the natural box.
   */
  const measure = () => {
    cls.add('scene-measure', 'scene-still');
    heroH = hero.offsetHeight;
    cards.forEach((card, i) => {
      const slot = slots[i];
      if (!slot) return;
      const a = card.getBoundingClientRect();
      const b = slot.getBoundingClientRect();
      const s = card.style;
      s.setProperty('--dx', `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
      s.setProperty('--dy', `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
      s.setProperty('--s', (b.width / a.width).toFixed(4));
      s.setProperty('--r', getComputedStyle(slot).getPropertyValue('--r').trim() || '0deg');
    });
    cls.remove('scene-measure');
    void getComputedStyle(cards[0]).transform;
    cls.remove('scene-still');
  };

  const tilt = (x: number, y: number) => {
    root.style.setProperty('--tx', `${(-y * 4).toFixed(2)}deg`);
    root.style.setProperty('--ty', `${(x * 4).toFixed(2)}deg`);
  };

  const update = () => {
    frame = 0;
    if (stopped) return;
    const next = Math.min(1, Math.max(0, scrollY / Math.max(1, heroH - 120)));
    if (next === p) return;
    p = next;
    root.style.setProperty('--p', p.toFixed(4));
    cls.toggle('scene-moving', p > 0 && p < 1);
    const tilting = fine && p < 0.05;
    cls.toggle('scene-tilt', tilting);
    if (!tilting) tilt(0, 0);
  };

  const schedule = () => {
    if (!frame && !stopped) frame = requestAnimationFrame(update);
  };

  const remeasure = () => {
    measureFrame = 0;
    if (stopped) return;
    measure();
    p = -1;
    schedule();
  };

  const onPointer = (e: PointerEvent) => {
    if (p >= 0.05) return;
    tilt((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
  };
  const onLeave = () => tilt(0, 0);

  const ro = new ResizeObserver(() => {
    if (!measureFrame && !stopped) measureFrame = requestAnimationFrame(remeasure);
  });
  ro.observe(hero);
  if (cards[0].parentElement) ro.observe(cards[0].parentElement.parentElement ?? cards[0].parentElement);

  addEventListener('scroll', schedule, { passive: true });
  if (fine) {
    hero.addEventListener('pointermove', onPointer, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
  }

  // Same task: hide-until-measured, measure, place, reveal.
  cls.add('scene');
  measure();
  update();
  cls.add('scene-ready');

  return () => {
    stopped = true;
    ro.disconnect();
    removeEventListener('scroll', schedule);
    hero.removeEventListener('pointermove', onPointer);
    hero.removeEventListener('pointerleave', onLeave);
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    frame = measureFrame = 0;
    cls.remove('scene', 'scene-ready', 'scene-moving', 'scene-tilt', 'scene-measure', 'scene-still');
    for (const name of ['--p', '--tx', '--ty']) root.style.removeProperty(name);
    for (const card of cards) {
      for (const name of ['--dx', '--dy', '--s', '--r']) card.style.removeProperty(name);
    }
  };
}
