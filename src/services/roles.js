import { saveToStorage } from './storage'

const ROLES_KEY = 'admin_roles'
const CURRENT_ROLE_KEY = 'current_role_id'

// Used only if every role has been deleted, or the assumed role id doesn't
// match anything — keeps the app from ever locking everyone out.
const FALLBACK_ROLE = {
  id: 'role_fallback',
  name: 'Everyone (fallback)',
  views: {
    calendar: true, editorial: true, production: true, technical: true,
    booths: true, 'book-staff': true, 'resource-gaps': true, assets: true,
    'book-assets': true, import: true, admin: true,
  },
  permissions: {
    events: { create: true, read: true, update: true, delete: true },
    humanAssets: { create: true, read: true, update: true, delete: true },
    technicalAssets: { create: true, read: true, update: true, delete: true },
  },
}

export function loadRoles() {
  try { return JSON.parse(localStorage.getItem(ROLES_KEY) || '[]') }
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
