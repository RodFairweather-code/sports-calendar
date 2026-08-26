import imgLogoWhite from '../assets/img-brand/img-logo-white.png'

const SKINS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The current look — navy header, default system font.',
    swatchBg: '#1e3a5f',
    logo: null,
  },
  {
    id: 'img',
    name: 'IMG',
    description: 'IMG brand blue, neutral white background, Album Sans Power.',
    swatchBg: '#0064ff',
    logo: imgLogoWhite,
  },
]

function AppearanceView({ skin, onSkinChange }) {
  return (
    <div className="av-container">
      <p className="av-intro">
        Choose which visual skin the app uses. This only changes colors, fonts and
        logos — none of your data is affected, and you can switch back at any time.
      </p>

      <div className="av-grid">
        {SKINS.map(s => (
          <button
            key={s.id}
            type="button"
            className={`av-card${skin === s.id ? ' av-card--active' : ''}`}
            onClick={() => onSkinChange(s.id)}
          >
            <div className="av-swatch" style={{ background: s.swatchBg }}>
              {s.logo && <img src={s.logo} alt="" className="av-swatch-logo" />}
            </div>
            <div className="av-card-body">
              <span className="av-card-name">{s.name}</span>
              <span className="av-card-desc">{s.description}</span>
            </div>
            <span className="av-card-status">
              {skin === s.id ? 'Active' : 'Select'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AppearanceView
