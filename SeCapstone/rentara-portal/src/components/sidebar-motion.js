/** Decorative navigation motion. Links, routing and permissions stay authoritative. */
export function sidebarPosition(sidebar) {
  const scroll = sidebar?.querySelector('.sidebar__scroll');
  const marker = sidebar?.querySelector('.sidebar__highlight');
  if (!scroll || !marker || marker.hidden) return null;
  const box = marker.getBoundingClientRect(), parent = scroll.getBoundingClientRect();
  return { y: box.top - parent.top + scroll.scrollTop, height: box.height,
    scrollTop: scroll.scrollTop, href: sidebar.querySelector('.nav-item.is-active')?.getAttribute('href') };
}

export function mountSidebarMotion(sidebar, previous) {
  const scroll = sidebar.querySelector('.sidebar__scroll');
  const marker = sidebar.querySelector('.sidebar__highlight');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  if (previous) scroll.scrollTop = previous.scrollTop;
  const place = (animate = false) => {
    const active = sidebar.querySelector('.nav-item.is-active');
    if (!active) { marker.hidden = true; sidebar.removeAttribute('data-highlight-ready'); return; }
    const box = active.getBoundingClientRect(), parent = scroll.getBoundingClientRect();
    const y = box.top - parent.top + scroll.scrollTop;
    marker.hidden = false;
    marker.style.height = `${box.height}px`;
    marker.style.transform = `translateY(${y}px)`;
    sidebar.setAttribute('data-highlight-ready', '');
    if (animate && previous && previous.href !== active.getAttribute('href') &&
        !reducedMotion.matches) {
      marker.animate([
        {transform:`translateY(${previous.y}px) scaleY(${previous.height / box.height})`},
        {transform:`translateY(${y}px) scaleY(1)`},
      ], {duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  };
  place(true);
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => place());
  });
  observer.observe(scroll);
  const cancelMotion = () => { if(reducedMotion.matches)marker.getAnimations().forEach(a=>a.cancel()); };
  reducedMotion.addEventListener('change',cancelMotion);
  return () => { observer.disconnect(); cancelAnimationFrame(frame); reducedMotion.removeEventListener('change',cancelMotion); marker.getAnimations().forEach(a=>a.cancel()); };
}
