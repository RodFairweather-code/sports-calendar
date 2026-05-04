import { useState } from 'react'
import PatternsView from './PatternsView'
import StaffView from './StaffView'
import PlatformsView from './PlatformsView'
import TechStackView from './TechStackView'

function AdminView() {
  const [adminTab, setAdminTab] = useState('patterns')

  return (
    <div className="admin-view">
      <div className="admin-content">
        {adminTab === 'patterns'   && <PatternsView />}
        {adminTab === 'staff'      && <StaffView />}
        {adminTab === 'platforms'  && <PlatformsView />}
        {adminTab === 'techstack'  && <TechStackView />}
      </div>
      <div className="admin-bottom-bar">
        <button className={`admin-tab-btn${adminTab === 'patterns'  ? ' active' : ''}`} onClick={() => setAdminTab('patterns')}>Patterns</button>
        <button className={`admin-tab-btn${adminTab === 'staff'     ? ' active' : ''}`} onClick={() => setAdminTab('staff')}>Staff</button>
        <button className={`admin-tab-btn${adminTab === 'platforms' ? ' active' : ''}`} onClick={() => setAdminTab('platforms')}>Platforms</button>
        <button className={`admin-tab-btn${adminTab === 'techstack' ? ' active' : ''}`} onClick={() => setAdminTab('techstack')}>Tech Stack</button>
      </div>
    </div>
  )
}

export default AdminView
