// Sports Calendar — User Types (Roles) Seed Data
// Applied on first load only, when localStorage has no role data.
// Fully editable afterward via Admin -> User Types.

function views(overrides) {
  const all = {
    calendar: false, editorial: false, production: false, technical: false,
    booths: false, 'book-staff': false, 'resource-gaps': false, assets: false,
    'book-assets': false, import: false, admin: false,
  }
  return { ...all, ...overrides }
}

function perms(events, humanAssets, technicalAssets) {
  const quad = (c, r, u, d) => ({ create: c, read: r, update: u, delete: d })
  return {
    events: quad(...events),
    humanAssets: quad(...humanAssets),
    technicalAssets: quad(...technicalAssets),
  }
}

export const SEED_ROLES = [
  {
    id: 'role_administrator',
    name: 'Administrator',
    views: views({
      calendar: true, editorial: true, production: true, technical: true,
      booths: true, 'book-staff': true, 'resource-gaps': true, assets: true,
      'book-assets': true, import: true, admin: true,
    }),
    permissions: perms(
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
    ),
  },
  {
    id: 'role_senior_manager',
    name: 'Senior Manager',
    views: views({
      calendar: true, editorial: true, production: true, technical: true,
      booths: true, 'book-staff': true, 'resource-gaps': true, assets: true,
      'book-assets': true, import: true, admin: false,
    }),
    permissions: perms(
      [true, true, true, true],
      [true, true, true, false],
      [false, true, false, false],
    ),
  },
  {
    id: 'role_standard_operator',
    name: 'Standard Operator',
    views: views({
      calendar: true, editorial: true, production: true, technical: true,
      booths: true, 'book-staff': true, 'resource-gaps': true, 'book-assets': true,
    }),
    permissions: perms(
      [false, true, true, false],
      [false, true, true, false],
      [false, true, false, false],
    ),
  },
  {
    id: 'role_mcr_operator',
    name: 'MCR Operator',
    views: views({
      calendar: true, technical: true, booths: true, 'resource-gaps': true,
      'book-assets': true, assets: true,
    }),
    permissions: perms(
      [false, true, true, false],
      [false, false, false, false],
      [false, true, true, false],
    ),
  },
  {
    id: 'role_asset_manager',
    name: 'Asset Manager',
    views: views({
      calendar: true, technical: true, 'resource-gaps': true,
      'book-assets': true, assets: true,
    }),
    permissions: perms(
      [false, true, false, false],
      [false, false, false, false],
      [true, true, true, true],
    ),
  },
  {
    id: 'role_editorial_planner',
    name: 'Editorial Planner',
    views: views({
      calendar: true, editorial: true, 'resource-gaps': true, import: true,
    }),
    permissions: perms(
      [true, true, true, true],
      [false, false, false, false],
      [false, false, false, false],
    ),
  },
]
