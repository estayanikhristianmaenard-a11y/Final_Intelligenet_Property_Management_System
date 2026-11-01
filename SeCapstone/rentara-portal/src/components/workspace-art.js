import { html } from "../utils/dom.js";

/** Shared decorative artwork; never a source of account or billing information. */
export function workspaceArt() {
  return html`<div class="mint-workspace-art" aria-hidden="true">
    <span class="mint-workspace-art__sun"></span>
    <span class="mint-workspace-art__spark">✦</span>
    <img src="./src/assets/mint-apartments.svg" width="400" height="210" alt="" />
  </div>`;
}
