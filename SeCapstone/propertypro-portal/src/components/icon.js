import { html, TrustedString } from "../utils/dom.js";

/**
 * Inline SVG icon registry (24×24, stroke-based) so the portal ships with
 * zero icon-font or image dependencies.
 *
 * Paths are static, developer-authored markup — they are wrapped in a
 * TrustedString so the `html` template does not escape them.
 */

const STROKE_PATHS = {
  dashboard:
    '<rect x="3" y="3" width="7.5" height="8" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.6"/><rect x="13.5" y="10.5" width="7.5" height="10.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  building:
    '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21"/><path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M2.5 21h19"/><path d="M7 8h4M7 12h4M7 16h4M17 14h1M17 17.5h1"/>',
  grid:
    '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  users:
    '<path d="M16 20.5v-1.8a3.7 3.7 0 0 0-3.7-3.7H6.7A3.7 3.7 0 0 0 3 18.7v1.8"/><circle cx="9.5" cy="7.8" r="3.8"/><path d="M21 20.5v-1.8a3.7 3.7 0 0 0-2.8-3.6"/><path d="M15.5 4.3a3.8 3.8 0 0 1 0 7"/>',
  receipt:
    '<path d="M5 21V4.2A1.2 1.2 0 0 1 6.2 3h11.6A1.2 1.2 0 0 1 19 4.2V21l-2.3-1.4L14.4 21l-2.4-1.4L9.6 21l-2.3-1.4z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  chart:
    '<path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21"/><path d="M7 15.5l3.6-4.4 3 2.7L20 7"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2.2"/><circle cx="15" cy="12" r="2.2"/><circle cx="9" cy="18" r="2.2"/>',
  shield:
    '<path d="M12 21s7.5-3.4 7.5-9.4V5.9L12 3 4.5 5.9v5.7C4.5 17.6 12 21 12 21z"/><path d="M9.2 12.2l2 2 3.6-4"/>',
  bell:
    '<path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.2 7.4-2.2 7.4h16.4S18 14.6 18 8.6z"/><path d="M13.7 19.4a2 2 0 0 1-3.4 0"/>',
  home:
    '<path d="M3 10.4 12 3l9 7.4"/><path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6"/><path d="M9.5 21v-6h5v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.4 12.2 2.5 2.5 4.7-5.2"/>',
  "alert-triangle":
    '<path d="M10.3 3.9 2.6 17.1A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"/><path d="M12 9v4.2M12 16.6h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3.1 1.9"/>',
  file:
    '<path d="M14 3H7a1.8 1.8 0 0 0-1.8 1.8v14.4A1.8 1.8 0 0 0 7 21h10a1.8 1.8 0 0 0 1.8-1.8V7.8z"/><path d="M14 3v4.8h4.8"/><path d="M8.6 13h6.8M8.6 16.6h4.6"/>',
  image:
    '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.6" cy="10" r="1.6"/><path d="m4 17.5 4.7-4.4 3.3 3 3-2.6 5 4.5"/>',
  download:
    '<path d="M12 3.5v11"/><path d="m7.6 10.4 4.4 4.4 4.4-4.4"/><path d="M4.5 20.5h15"/>',
  eye: '<path d="M2.5 12S6 5.6 12 5.6 21.5 12 21.5 12 18 18.4 12 18.4 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  "chevron-right": '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  "chevron-down": '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
  "chevron-left": '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  "arrow-up-right": '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
  "arrow-right": '<path d="M4.5 12h15"/><path d="m13.5 6 6 6-6 6"/>',
  filter: '<path d="M3.5 5.5h17l-6.6 7.6v5.4l-3.8 2v-7.4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.6 6.4 8.4 6 8.4-6"/>',
  phone:
    '<path d="M21 16.9v2.6a1.7 1.7 0 0 1-1.9 1.7 17 17 0 0 1-7.4-2.6 16.7 16.7 0 0 1-5.1-5.1A17 17 0 0 1 4 6.1 1.7 1.7 0 0 1 5.7 4.2h2.6a1.7 1.7 0 0 1 1.7 1.5c.1.9.3 1.7.6 2.5a1.7 1.7 0 0 1-.4 1.8l-1.1 1.1a13.6 13.6 0 0 0 5.1 5.1l1.1-1.1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.5.6a1.7 1.7 0 0 1 1.4 1.6z"/>',
  "map-pin":
    '<path d="M20 10.4c0 5.6-8 12-8 12s-8-6.4-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10.2" r="2.9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21v-1.4A5.1 5.1 0 0 1 9.6 14.5h4.8a5.1 5.1 0 0 1 5.1 5.1V21"/>',
  logout:
    '<path d="M9.5 21H5.6A1.6 1.6 0 0 1 4 19.4V4.6A1.6 1.6 0 0 1 5.6 3h3.9"/><path d="M15.5 16.5 20 12l-4.5-4.5"/><path d="M20 12H9.5"/>',
  refresh:
    '<path d="M20.5 11.5a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 4v5h-5"/>',
  zap: '<path d="M13.2 2.5 4.8 13.6h6.3l-.9 7.9 8.4-11.1h-6.3z"/>',
  droplet: '<path d="M12 3.2s6 6.2 6 10.3a6 6 0 1 1-12 0C6 9.4 12 3.2 12 3.2z"/>',
  bolt: '<path d="M13.4 2.5 5 13.4h5.7l-.6 8.1L17.6 10h-5.7z"/>',
  key: '<circle cx="8" cy="15.5" r="4.5"/><path d="m11.3 12.2 8-8"/><path d="m16 6.5 2.4 2.4M13.6 8.9 16 11.3"/>',
  database:
    '<ellipse cx="12" cy="5.8" rx="8" ry="3.2"/><path d="M4 5.8v12.4c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V5.8"/><path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2"/>',
  activity: '<path d="M3 12h4l2.5-7 4.5 14 2.6-7H21"/>',
  layers: '<path d="m12 3 8.5 4.6L12 12.2 3.5 7.6z"/><path d="m3.5 12.4 8.5 4.6 8.5-4.6"/><path d="m3.5 16.9 8.5 4.6 8.5-4.6"/>',
  send: '<path d="M21 3.5 10.6 13.9"/><path d="M21 3.5 14.4 21l-3.8-7.1L3.5 10z"/>',
  inbox:
    '<path d="M3 13.5h5l1.6 2.6h4.8l1.6-2.6h5"/><path d="M4.6 5h14.8l2.1 8.5v4.9A1.6 1.6 0 0 1 19.9 20H4.1a1.6 1.6 0 0 1-1.6-1.6v-4.9z"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.6h17M8 3v4M16 3v4"/>',
  "credit-card": '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M6.5 14.5h3"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2M12 7.8h.01"/>',
  "more-horizontal":
    '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
  edit: '<path d="M16.5 3.9a2 2 0 0 1 2.8 2.8L8.2 17.8l-3.7.9.9-3.7z"/>',
  archive:
    '<rect x="3" y="4" width="18" height="4.5" rx="1.4"/><path d="M4.6 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11.8A1.5 1.5 0 0 0 19.4 19V8.5"/><path d="M10 12.4h4"/>',
};

/**
 * Render an icon by name.
 * @param {string} name
 * @param {{size?:number, strokeWidth?:number, className?:string}} [options]
 */
export function icon(name, { size = 18, strokeWidth = 1.75, className = "" } = {}) {
  const path = STROKE_PATHS[name] ?? STROKE_PATHS.info;
  return html`<svg
    class="icon ${className}"
    width="${size}"
    height="${size}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    >${new TrustedString(path)}</svg
  >`;
}

export const hasIcon = (name) => Boolean(STROKE_PATHS[name]);
export const iconNames = () => Object.keys(STROKE_PATHS);
export default icon;
