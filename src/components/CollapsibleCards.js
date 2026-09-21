import React, { useState } from 'react'
import { Button } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'

// Muestra u oculta un grupo de cards (resumen de reportes) para ahorrar espacio.
function CollapsibleCards({ children, label = 'resumen', defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <>
      <div style={{ textAlign: 'right', marginBottom: collapsed ? 0 : 4 }}>
        <Button type='link' size='small' icon={collapsed ? <DownOutlined /> : <UpOutlined />} onClick={() => setCollapsed(prev => !prev)}>
          {collapsed ? `Mostrar ${label}` : `Ocultar ${label}`}
        </Button>
      </div>
      {!collapsed && children}
    </>
  )
}

export default CollapsibleCards
