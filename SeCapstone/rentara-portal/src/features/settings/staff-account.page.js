import { html, render } from "../../utils/dom.js";
import session from "../../auth/session.js";
import { api } from "../../api/client.js";
import { dialogForm } from "../../app/workflows.js";
export async function renderStaffAccount(container) {
  render(container, html`<section class="page"><div class="page-header"><div><h1 id="page-title">Account</h1><p>Your profile and account security.</p></div></div><section class="card"><div class="card__body"><h2>${session.user.name}</h2><p>${session.user.email}</p><p>${session.user.workspaceName}</p><div class="row row-2"><button class="btn btn--primary" data-staff-profile>Edit profile</button><button class="btn btn--secondary" data-staff-password>Change password</button></div></div></section></section>`);
  container.querySelector("[data-staff-profile]").onclick = () => dialogForm({ title: "Edit profile",
    fields: [{ key: "name", label: "Name", required: true }, { key: "phone", label: "Phone" }], values: session.user,
    save: data => api.patch("/auth/profile", data), onSaved(user) { session.updateUser(user); return renderStaffAccount(container); } });
  container.querySelector("[data-staff-password]").onclick = () => dialogForm({ title: "Change password",
    fields: [{ key: "currentPassword", label: "Current password", type: "password", required: true }, { key: "password", label: "New password (12+ characters)", type: "password", required: true }],
    save: data => api.patch("/auth/profile", data), onSaved() { session.clear(); window.dispatchEvent(new CustomEvent("app:signed-out")); }, successMessage: "Sign in again with your new password." });
}
