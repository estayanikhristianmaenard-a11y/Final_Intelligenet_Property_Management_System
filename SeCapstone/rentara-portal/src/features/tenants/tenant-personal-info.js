import { html } from '../../utils/dom.js';

// Pure presentation shared by operational and Admin read-only Tenant views.
export function tenantPersonalInformation(tenant,{showGovernmentId=true}={}) {
  const field=(label,value)=>html`<div class="desc-item"><span class="desc-item__label">${label}</span><span class="desc-item__value">${value??'—'}</span></div>`;
  return html`<section class="panel-section"><h3 class="section-title">Personal Information</h3><div class="desc-grid">
    ${field('Full name',tenant.fullName)}${field('E-mail',tenant.email)}${field('Mobile',tenant.phone)}
    ${showGovernmentId?field('Government ID',tenant.governmentId):null}
    ${field('Emergency contact',tenant.emergencyContactName)}${field('Emergency number',tenant.emergencyContactPhone)}
  </div></section>`;
}
