import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { CAPABILITY_ROWS, can } from "../../auth/rbac.js";
import { ROLE, ROLE_LABEL } from "../../config/constants.js";
import { initials, avatarTone, relative, dateTime } from "../../utils/format.js";

/**
 * Admin Settings — user accounts and the role/permission matrix.
 * The only place where role grants are managed (system maintenance scope).
 */
export async function renderAdminSettings(container) {
  render(
    container,
    frame(html`<div class="card"><div class="card__body">${skeletonRows(5)}</div></div>`),
  );

  try {
    const users = await api.get(endpoints.adminUsers());
    render(container, frame(usersSection(users)));
    container
      .querySelectorAll("[data-user-action]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          toastSuccess(
            "Account updated",
            `${button.getAttribute("data-user-action")} — change recorded in the audit log.`,
          ),
        ),
      );
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Accounts could not be loaded",
          body: error.message,
        }),
      ),
    );
  }
}

function frame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
          <span>Admin</span>${icon("chevron-right", { size: 12 })}
          <span>Settings</span>
        </nav>
        <h1 id="page-title">Users &amp; Roles</h1>
        <p>Account maintenance and the role-based access control matrix.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" type="button">${icon("plus", { size: 15 })} Add user</button>
      </div>
    </div>

    <div class="stack stack-4">
      ${content}
      ${matrixSection()}
      ${securitySection()}
    </div>
  </section>`;
}

function usersSection(users) {
  return dataTable({
    ariaLabel: "User accounts",
    rows: users,
    toolbar: html`<span class="chip chip--accent">${icon("users", { size: 12 })} Accounts</span>
      <span class="table-toolbar__spacer"></span>
      <span class="text-xs text-muted">${users.length} accounts</span>`,
    emptyTitle: "No accounts",
    emptyIcon: "users",
    columns: [
      {
        key: "name",
        label: "User",
        render: (row) => html`<span class="cell-entity">
          <span class="avatar ${avatarTone(row.name)}">${initials(row.name)}</span>
          <span class="cell-entity__meta">
            <strong>${row.name}</strong>
            <span>${row.email}</span>
          </span>
        </span>`,
      },
      {
        key: "role",
        label: "Role",
        render: (row) =>
          badge(
            ROLE_LABEL[row.role] ?? row.role,
            row.role === ROLE.ADMIN ? "violet" : row.role === ROLE.MANAGER ? "primary" : "neutral",
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) =>
          row.status === "active"
            ? badge("Active", "success", { dot: true })
            : row.status === "service"
              ? badge("Service", "info", { dot: true })
              : badge("Suspended", "danger", { dot: true }),
      },
      {
        key: "lastSeen",
        label: "Last seen",
        width: "170px",
        render: (row) => html`<span class="time-cell" title="${dateTime(row.lastSeen)}"
          ><strong>${relative(row.lastSeen)}</strong>${row.id}</span
        >`,
      },
      {
        key: "actions",
        label: "",
        className: "cell-actions",
        render: (row) => html`<span class="row row-2" style="justify-content:flex-end">
          <button class="btn btn--ghost btn--sm" type="button" data-user-action="Role changed for ${row.name}">
            Change role
          </button>
          <button class="btn btn--secondary btn--sm" type="button" data-user-action="Password reset for ${row.name}">
            Reset password
          </button>
        </span>`,
      },
    ],
    footer: html`<span>Account changes are written to the audit log</span>
      <span class="text-muted">Admin · system maintenance scope</span>`,
  });
}

function matrixSection() {
  const roles = [ROLE.ADMIN, ROLE.MANAGER, ROLE.TENANT];

  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Role-based access control matrix</h2>
        <p class="card__subtitle">
          The front-end guard mirrors this table — the backend must enforce it per endpoint
        </p>
      </div>
      <span class="badge badge--violet">${CAPABILITY_ROWS.length} capabilities</span>
    </div>
    <div class="table-wrap">
      <table class="role-matrix" aria-label="Role permissions">
        <thead>
          <tr>
            <th scope="col">Capability</th>
            ${roles.map((role) => html`<th scope="col">${ROLE_LABEL[role]}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${CAPABILITY_ROWS.map(
            (row) => html`<tr>
              <td>${row.label}</td>
              ${roles.map((role) =>
                can(role, row.permission)
                  ? html`<td><span class="perm-yes">✓</span></td>`
                  : html`<td><span class="perm-no">—</span></td>`,
              )}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
    <div class="card__footer">
      <div class="row row-2 row-wrap">
        <span class="legend__item"><i class="legend__swatch" style="--swatch:#16a34a"></i>Granted</span>
        <span class="legend__item"><i class="legend__swatch" style="--swatch:#cbd5e1"></i>Denied</span>
        <span class="text-xs text-muted">
          Admin holds no billing, payment-confirmation or Exception Queue grants by design.
        </span>
      </div>
    </div>
  </section>`;
}

function securitySection() {
  const items = [
    {
      title: "User authentication",
      body: "Valid credentials are required before any protected function is reachable.",
      icon: "lock",
    },
    {
      title: "Data access restriction",
      body: "Property, tenant, billing, payment, exception and receipt data are restricted to authorised roles.",
      icon: "shield",
    },
    {
      title: "Input validation",
      body: "User input and OCR-extracted billing values are validated before storage or processing.",
      icon: "check-circle",
    },
    {
      title: "Session security",
      body: "Authenticated sessions are managed by the access-control mechanism and expire server-side.",
      icon: "key",
    },
  ];

  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Security requirements</h2>
        <p class="card__subtitle">Defined controls from the study's security requirements</p>
      </div>
    </div>
    <div class="card__body">
      <div class="desc-grid">
        ${items.map(
          (item) => html`<div class="doc-item" style="align-items:flex-start">
            <span class="doc-item__icon">${icon(item.icon, { size: 17 })}</span>
            <span class="doc-item__meta">
              <strong>${item.title}</strong>
              <span style="white-space:normal;line-height:1.5">${item.body}</span>
            </span>
          </div>`,
        )}
      </div>
      <div class="notice-strip notice-strip--warning mt-4">
        <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
        <span>
          These controls cover the defined system functions only. They do not constitute a legal
          audit or a claim of complete compliance with the Philippine Data Privacy Act.
        </span>
      </div>
    </div>
  </section>`;
}

export default renderAdminSettings;
