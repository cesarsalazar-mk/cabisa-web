import React from 'react'
import ServiceView from '../commons/serviceView'

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
}

function ServiceNote(props) {
  return (
    <div style={containerStyle}>
      <ServiceView
        canEditAndCreate={props.canEditAndCreate}
        isAdmin={props.isAdmin}
      />
    </div>
  )
}

export default ServiceNote
