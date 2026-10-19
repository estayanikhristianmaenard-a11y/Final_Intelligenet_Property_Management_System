import { html } from "../utils/dom.js";

// Approved Rentara option 02; decorative beside the visible brand name.
export function brandMark(size = 28) {
  return html`<svg class="rentara-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" aria-hidden="true" focusable="false"><path d="M17 53V23L32 11l16 12v9c0 7-5 11-12 11H20m13 0 15 10M19 28h15a7 7 0 0 1 0 14" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
