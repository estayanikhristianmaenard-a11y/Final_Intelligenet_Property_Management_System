/** Shared feedback follows real requests; no simulated completion or progress. */
export function beginAction(button, label = "Saving…") {
  const original = button.innerHTML;
  const previousMin = button.style.minWidth;
  button.style.minWidth = `${button.getBoundingClientRect().width}px`;
  button.disabled = true;
  button.setAttribute("aria-busy","true");
  button.classList.remove("is-saved");
  button.textContent = label;
  return (success = false) => {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = original;
    button.style.minWidth = previousMin;
    if (success) button.classList.add("is-saved");
  };
}

const copied = new WeakMap();
export function confirmCopy(button) {
  const previous = copied.get(button);
  if (previous) clearTimeout(previous.timer);
  const original = previous?.original ?? button.innerHTML;
  const minWidth = previous?.minWidth ?? button.style.minWidth;
  if (!previous) button.style.minWidth = `${Math.max(82,button.getBoundingClientRect().width)}px`;
  button.textContent = "✓ Copied";
  button.setAttribute("aria-label","Full reference copied");
  const timer = setTimeout(()=>{
    button.innerHTML=original;button.style.minWidth=minWidth;
    button.setAttribute("aria-label","Copy full receipt reference");copied.delete(button);
  },1400);
  copied.set(button,{original,minWidth,timer});
}

export function mountDisclosureMotion() {
  document.addEventListener("toggle",event=>{
    const details=event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open || !details.matches(".disclosure-card,.tenant-filter-disclosure,.tenant-calendar__info,.push-device-disclosure") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const child of details.children) if (child.tagName !== "SUMMARY") child.animate?.([{opacity:0},{opacity:1}],{duration:320,easing:"cubic-bezier(0.4, 0, 0.2, 1)"});
  },true);
}
