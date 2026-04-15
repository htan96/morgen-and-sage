/**
 * Shared Morgan’s Kitchen email branding (logo URL + HTML signature).
 * Keep logo src in one place — do not duplicate in templates.
 */

const LOGO_REL_PATH = "/logos/morgens-kitchen-dark.svg";

export function buildEmailLogoSrc(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base.replace(/\/$/, "")}${LOGO_REL_PATH}`;
}

/** Logo block for HTML emails (invoice + tenant messages). */
export function buildEmailLogoBlockHtml(): string {
  const src = buildEmailLogoSrc();
  return `<div style="margin-bottom:20px">
  <img
    src="${src}"
    alt="Morgen's Kitchen"
    width="150"
    style="display:block"
  />
</div>`;
}

/** Text signature below the message body (no logo — logo uses {@link buildEmailLogoBlockHtml}). */
export function buildEmailSignature(): string {
  return `<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
  <p style="margin: 0; font-weight: 600; color: #111;">
    Morgen's Kitchen
  </p>
  <p style="margin: 4px 0; color: #333; font-size: 14px;">
    Commissary Kitchen & Culinary Workspace
  </p>
  <p style="margin: 8px 0; color: #333; font-size: 14px;">
    <a href="mailto:morgenskitchen@gmail.com" style="color: #111;">morgenskitchen@gmail.com</a>
  </p>
</div>`;
}
