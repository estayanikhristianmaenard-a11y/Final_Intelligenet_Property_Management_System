/** In-memory dirty tracking; no drafts, credentials or billing data are persisted. */
const tracked = new Set();
const controls = root => [...root.querySelectorAll("input,select,textarea")].filter(input => !input.disabled && !["submit","button"].includes(input.type));
const snapshot = root => JSON.stringify(controls(root).map(input => [input.id || input.name, input.type === "checkbox" || input.type === "radio" ? input.checked : input.type === "file" ? [...input.files].map(file=>[file.name,file.size,file.lastModified]) : input.value]));
function prune() { for (const guard of tracked) if (!guard.root.isConnected) guard.dispose(); }
export function watchForm(root, {onChange = () => {}, read = () => snapshot(root)} = {}) {
  prune();
  let baseline = read();
  let initial = controls(root).map(input=>({input,value:input.value,checked:input.checked}));
  const update = () => onChange(read() !== baseline);
  const guard = {
    root,
    isDirty: () => read() !== baseline,
    markClean() { baseline=read();initial=controls(root).map(input=>({input,value:input.value,checked:input.checked})); update(); },
    reset() { initial.forEach(({input,value,checked})=>{input.value=value;input.checked=checked;}); update(); },
    dispose() { root.removeEventListener("input",update);root.removeEventListener("change",update);tracked.delete(guard); },
  };
  root.addEventListener("input",update);root.addEventListener("change",update);
  tracked.add(guard);update();return guard;
}
export function hasUnsavedChanges() {
  prune();
  return [...tracked].some(guard=>guard.isDirty());
}
export function confirmPageLeave() {
  return !hasUnsavedChanges() || window.confirm("Discard your unsaved changes?");
}
window.addEventListener("beforeunload",event=>{
  prune();
  if ([...tracked].some(guard=>guard.isDirty())) {event.preventDefault();event.returnValue="";}
});
