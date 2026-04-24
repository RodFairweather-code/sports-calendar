// All IDs verified against TheSportsDB free-tier API (v1, key 3).
// slugs[] are fixturedownload.com feed slugs — 404s are handled gracefully.
// When slugs are present, fixturedownload is used as the data source.
// When only id is present, TheSportsDB is used.
// id: null with no slugs means no free-tier data source available.

const GOVERNING_BODIES = {
  Soccer: [
    {
      name: 'Premier League',
      competitions: [
        { name: 'Premier League', id: null, color: '#380073', localData: 'epl_2025', slugs: ['epl-2025', 'epl-2026'] },
      ],
    },
    {
      name: 'EFL (English Football League)',
      competitions: [
        { name: 'Championship',          id: '4329', color: '#00285e', localData: 'championship_2025', slugs: ['efl-championship-2025', 'efl-championship-2026'],   lookupName: 'English League Championship', country: 'England' },
        { name: 'League One',            id: '4396', color: '#0057a8', slugs: ['efl-league-one-2025', 'efl-league-one-2026'],       lookupName: 'English League 1',            country: 'England' },
        { name: 'League Two',            id: '4397', color: '#0097d5', slugs: ['efl-league-two-2025', 'efl-league-two-2026'],       lookupName: 'English League 2',            country: 'England' },
        { name: 'EFL Cup (Carabao Cup)', id: '4570', color: '#7b2fa0', slugs: ['efl-cup-2025', 'efl-cup-2026'],                    lookupName: 'EFL Cup',                     country: 'England' },
        { name: 'EFL Trophy',            id: '4847', color: '#ff6b1a', slugs: ['efl-trophy-2025', 'efl-trophy-2026'],              lookupName: 'EFL Trophy',                  country: 'England' },
      ],
    },
    {
      name: 'The FA',
      competitions: [
        { name: 'FA Cup', id: null, color: '#d4003b', slugs: ['fa-cup-2025', 'fa-cup-2026'] },
      ],
    },
    {
      name: 'Scottish FA',
      competitions: [
        { name: 'Scottish Premiership',  id: '4330', color: '#003087', slugs: ['scottish-premiership-2025', 'scottish-premiership-2026'],   lookupName: 'Scottish Premier League', country: 'Scotland' },
        { name: 'Scottish Championship', id: '4395', color: '#005096', slugs: ['scottish-championship-2025', 'scottish-championship-2026'],  lookupName: 'Scottish Championship',   country: 'Scotland' },
        { name: 'Scottish League One',   id: '4669', color: '#1976d2', slugs: ['scottish-league-one-2025', 'scottish-league-one-2026'],      lookupName: 'Scottish League 1',       country: 'Scotland' },
        { name: 'Scottish League Two',   id: '4670', color: '#42a5f5', slugs: ['scottish-league-two-2025', 'scottish-league-two-2026'],      lookupName: 'Scottish League 2',       country: 'Scotland' },
        { name: 'Scottish FA Cup',       id: '4723', color: '#bf360c', slugs: ['scottish-fa-cup-2025', 'scottish-fa-cup-2026'],             lookupName: 'Scottish FA Cup',         country: 'Scotland' },
        { name: 'Scottish League Cup',   id: '4888', color: '#a50044', slugs: ['scottish-league-cup-2025', 'scottish-league-cup-2026'],     lookupName: 'Scottish League Cup',     country: 'Scotland' },
      ],
    },
    {
      name: 'Welsh FA (FAW)',
      competitions: [
        { name: 'Welsh Premier League', id: '4334', color: '#c8102e', slugs: ['welsh-premier-league-2025', 'welsh-premier-league-2026'], lookupName: 'Welsh Premier League', country: 'Wales' },
      ],
    },
    {
      name: 'UEFA',
      competitions: [
        { name: 'Champions League',  id: null, color: '#003087', slugs: ['ucl-2025', 'ucl-2026'] },
        { name: 'Europa League',     id: null, color: '#ff6900', slugs: ['uel-2025', 'uel-2026'] },
        { name: 'Conference League', id: null, color: '#00a86b', slugs: ['uecl-2025', 'uecl-2026'] },
      ],
    },
  ],

  'Rugby Union': [
    {
      name: 'Premiership Rugby',
      competitions: [
        { name: 'Gallagher Premiership', id: '4414', color: '#4f0055', slugs: ['premiership-rugby-2025', 'premiership-rugby-2026'], lookupName: 'English Prem Rugby',     country: 'England' },
        { name: 'Prem Rugby Cup',        id: '5695', color: '#7b1fa2', slugs: ['premiership-rugby-cup-2025'],                      lookupName: 'English Prem Rugby Cup', country: 'England' },
      ],
    },
    {
      name: 'World Rugby',
      competitions: [
        { name: 'Six Nations', id: null, color: '#1d4e89', slugs: ['six-nations-2026'] },
      ],
    },
  ],

  'Rugby League': [
    {
      name: 'Rugby Football League (RFL)',
      competitions: [
        { name: 'Super League', id: '4415', color: '#c8102e', slugs: ['super-league-2025', 'super-league-2026'], lookupName: 'English Rugby League Super League', country: 'England' },
      ],
    },
  ],

  Cricket: [
    {
      name: 'England and Wales Cricket Board (ECB)',
      competitions: [
        { name: 'County Championship (Div 1)', id: '4458', color: '#004225', slugs: ['county-championship-division-1-2025', 'county-championship-division-1-2026'], lookupName: 'English County Championship Division 1', country: 'England' },
        { name: 'County Championship (Div 2)', id: '4459', color: '#1b5e20', slugs: ['county-championship-division-2-2025', 'county-championship-division-2-2026'], lookupName: 'English County Championship Division 2', country: 'England' },
        { name: 'T20 Blast',                   id: '4463', color: '#e65100', slugs: ['t20-blast-2025', 't20-blast-2026'],                                          lookupName: 'English t20 Blast',                      country: 'England' },
      ],
    },
    {
      name: 'BCCI (India)',
      competitions: [
        { name: 'Indian Premier League', id: '4460', color: '#4a148c', slugs: ['ipl-2025', 'ipl-2026'], lookupName: 'Indian Premier League' },
      ],
    },
    {
      name: 'Cricket Australia',
      competitions: [
        { name: 'Big Bash League', id: '4461', color: '#01579b', slugs: ['big-bash-league-2025', 'big-bash-league-2026'], lookupName: 'Australian Big Bash League' },
      ],
    },
  ],

  Motorsport: [
    {
      name: 'FIA',
      competitions: [
        { name: 'Formula 1',                     id: null,   color: '#e10600', localData: 'f1_2026', slugs: ['f1-2025', 'f1-2026'] },
        { name: 'World Rallycross Championship',  id: '4730', color: '#0277bd', slugs: ['world-rallycross-2025', 'world-rallycross-2026'], lookupName: 'World Rallycross Championship' },
      ],
    },
    {
      name: 'Motorsport UK',
      competitions: [
        { name: 'British Touring Car Championship (BTCC)', id: '4372', color: '#1b5e20', slugs: ['btcc-2025', 'btcc-2026'],                       lookupName: 'BTCC'                          },
        { name: 'British GT Championship',                  id: '4410', color: '#33691e', slugs: ['british-gt-2025', 'british-gt-2026'],            lookupName: 'British GT Championship'        },
        { name: 'British Superbike Championship (BSB)',     id: '5264', color: '#4e342e', slugs: ['british-superbike-2025', 'british-superbike-2026'], lookupName: 'British Superbike Championship' },
      ],
    },
  ],

  Tennis: [
    {
      name: 'ATP',
      competitions: [
        { name: 'ATP World Tour', id: '4464', color: '#006747', lookupName: 'ATP World Tour' },
      ],
    },
    {
      name: 'WTA',
      competitions: [
        { name: 'WTA Tour', id: '4517', color: '#880e4f', localData: 'wta_2026', lookupName: 'WTA Tour' },
      ],
    },
    {
      name: 'ITF',
      competitions: [
        { name: 'Davis Cup',                      id: '5347', color: '#1a237e', slugs: ['davis-cup-2025', 'davis-cup-2026'], lookupName: 'Davis Cup' },
        { name: 'Billie Jean King Cup (Fed Cup)',  id: '5348', color: '#6a1b9a', lookupName: 'Fed Cup' },
        { name: 'Laver Cup',                      id: '4581', color: '#37474f', slugs: ['laver-cup-2025', 'laver-cup-2026'], lookupName: 'Laver Cup' },
      ],
    },
  ],

  Golf: [
    {
      name: 'PGA Tour',
      competitions: [
        { name: 'PGA Tour', id: null, color: '#1a237e', premium: true, premiumNote: 'PGA Tour fixtures are not available on the TheSportsDB free tier.' },
      ],
    },
    {
      name: 'DP World Tour',
      competitions: [
        { name: 'DP World Tour (European Challenge)', id: '4758', color: '#0d47a1', lookupName: 'European Challenge Tour' },
      ],
    },
  ],
}

export default GOVERNING_BODIES
