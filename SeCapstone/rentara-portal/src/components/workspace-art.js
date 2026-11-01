import { html } from "../utils/dom.js";

/** Shared decorative artwork; never a source of account or billing information. */
export function workspaceArt(kind = "homes") {
  const asset = {homes:"mint-apartments.svg", bills:"mint-bill-desk.svg", accounts:"mint-key-home.svg"}[kind] ?? "mint-apartments.svg";
  return html`<div class="mint-workspace-art" aria-hidden="true">
    <span class="mint-workspace-art__sun"></span>
    <span class="mint-workspace-art__spark">✦</span>
    <img src="./src/assets/${asset}" width="400" height="230" alt="" />
  </div>`;
}
