import React from 'react'
import { Tabs } from 'antd'
import ServiceNote from './serviceNote/serviceNoteIndex'

const { TabPane } = Tabs

const tabsStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
}

function SalesTabIndex(props) {
  return (
    <Tabs
      id={'shippingNote'}
      defaultActiveKey='1'
      style={tabsStyle}
      tabBarStyle={{ flexShrink: 0, marginBottom: 0 }}
    >
      <TabPane
        tab='Nota de servicio'
        key='1'
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          height: '100%',
        }}
      >
        <ServiceNote
          canEditAndCreate={props.canEditAndCreate}
          isAdmin={props.isAdmin}
        />
      </TabPane>
    </Tabs>
  )
}

export default SalesTabIndex
