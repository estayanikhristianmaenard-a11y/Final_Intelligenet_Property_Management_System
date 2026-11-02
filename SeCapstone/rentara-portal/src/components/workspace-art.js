import { html } from "../utils/dom.js";
import { icon } from "./icon.js";

/** Shared decorative artwork; never a source of account or billing information. */
export function workspaceArt(kind = "homes") {
  const asset = {homes:"mint-neighborhood.svg", bills:"mint-bill-desk.svg", accounts:"mint-key-home.svg"}[kind] ?? "mint-neighborhood.svg";
  return html`<div class="mint-workspace-art" aria-hidden="true">
    <span class="mint-workspace-art__sun"></span>
    <span class="mint-workspace-art__spark">✦</span>
    <span class="mint-scene-token mint-scene-token--home">${icon("building",{size:18})}</span>
    <span class="mint-scene-token mint-scene-token--water">${icon("droplet",{size:17})}</span>
    <img src="./src/assets/${asset}" width="400" height="230" alt="" />
    <span class="mint-scene-caption">a little more room to grow</span>
  </div>`;
}
