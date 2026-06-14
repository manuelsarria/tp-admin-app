// System-wide privileged accounts.
//
// Only the super-admin may create or promote users to the ADMIN role. This is
// enforced on the SERVER (see src/app/api/users) — hiding the option in the UI
// is only a convenience, not the security boundary.

/** The single account allowed to create/promote ADMIN users. */
export const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || 'manuell.sarria@gmail.com'
)
  .trim()
  .toLowerCase()

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}
