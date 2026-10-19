/** Event-driven connectivity feedback; never polls or queues writes. */
export function mountConnectionStatus() {
  let banner, timer;
  const show = (state) => {
    clearTimeout(timer);timer=null;
    banner ??= Object.assign(document.createElement("div"),{className:"connection-status"});
    banner.setAttribute("role","status");
    banner.textContent = state === "offline" ? "Offline. New actions need a connection." : state === "unreachable" ? "Cannot reach the server. Check the connection and retry." : "Connection available. Retry any action that failed.";
    if (!banner.isConnected) document.body.append(banner);
    if (state === "available") timer=setTimeout(()=>banner.remove(),5000);
  };
  window.addEventListener("offline",()=>show("offline"));
  window.addEventListener("online",()=>show("available"));
  window.addEventListener("app:connection-state",event=>show(event.detail));
  window.addEventListener("app:request-succeeded",()=>{if (banner?.isConnected && !timer) show("available");});
  if (navigator.onLine === false) show("offline");
}
