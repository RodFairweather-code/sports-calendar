import { saveToStorage } from './storage'

const ROLES_KEY = 'admin_roles'
const CURRENT_ROLE_KEY = 'current_role_id'

// Used only if every role has been deleted, or the assumed role id doesn't
// match anything — keeps the app from ever locking everyone out.
const FALLBACK_ROLE = {
  id: 'role_fallback',
  name: 'Everyone (fallback)',
  views: {
    calendar: true, editorial: true, production: true, technical: true, technical2: true,
    booths: true, 'book-staff': true, 'staff-availability': true, 'resource-gaps': true, assets: true,
    'book-assets': true, import: true, admin: true,
  },
  permissions: {
    events: { create: true, read: true, update: true, delete: true },
    humanAssets: { create: true, read: true, update: true, delete: true },
    technicalAssets: { create: true, read: true, update: true, delete: true },
  },
}

// Roles persisted before a new nav view existed won't have a key for it, which
// canSeeView reads as hidden. Default each new view to whatever a sibling view
// was set to, rather than silently disappearing for every already-saved role.
function backfillViews(role) {
  let views = role.views
  if (views?.technical2 === undefined) {
    views = { ...views, technical2: !!views?.technical }
  }
  if (views?.['staff-availability'] === undefined) {
    views = { ...views, 'staff-availability': !!views?.['book-staff'] }
  }
  return views === role.views ? role : { ...role, views }
}

export function loadRoles() {
  try {
    const roles = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]').map(backfillViews)
    if (roles.length > 0) saveToStorage(ROLES_KEY, roles)
    return roles
  }
  catch { return [] }
}

export function persistRoles(roles) {
  saveToStorage(ROLES_KEY, roles)
}

export function loadCurrentRoleId() {
  return localStorage.getItem(CURRENT_ROLE_KEY) || ''
}

export function persistCurrentRoleId(id) {
  localStorage.setItem(CURRENT_ROLE_KEY, id)
}

export function getActiveRole(roles, id) {
  return roles.find(r => r.id === id) || roles[0] || FALLBACK_ROLE
}

export function canSeeView(role, viewId) {
  return !!role?.views?.[viewId]
}

export function hasPermission(role, bucket, action) {
  return !!role?.permissions?.[bucket]?.[action]
}
