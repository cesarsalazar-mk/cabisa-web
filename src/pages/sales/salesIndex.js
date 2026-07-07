import React, { useRef, useState, useLayoutEffect } from 'react'
import { useHistory } from 'react-router-dom'
import HeaderPage from '../../components/HeaderPage'
import ServiceView from './components/commons/serviceView'
import { validatePermissions, validateRole } from '../../utils'
import { actions, permissions, roles } from '../../commons/types'

const CONTENT_PADDING_BOTTOM = 24

function getAvailablePageHeight(pageTop) {
  const footer = document.querySelector('.ant-layout-footer')
  const footerHeight = footer?.getBoundingClientRect().height || 30

  return window.innerHeight - pageTop - footerHeight - CONTENT_PADDING_BOTTOM
}

function Sales() {
  const pageRef = useRef(null)
  const history = useHistory()
  const [pageHeight, setPageHeight] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const can = validatePermissions(permissions.VENTAS)
  const canEditAndCreate = can(actions.CREATE) || can(actions.EDIT)
  const isAdmin = validateRole(roles.ADMIN) || validateRole(roles.SELLS)

  const newNote = () => history.push('/serviceNoteView')

  useLayoutEffect(() => {
    const updatePageHeight = () => {
      if (!pageRef.current) return

      const { top } = pageRef.current.getBoundingClientRect()
      setPageHeight(getAvailablePageHeight(top))
    }

    updatePageHeight()
    window.addEventListener('resize', updatePageHeight)

    const frameId = requestAnimationFrame(updatePageHeight)

    return () => {
      window.removeEventListener('resize', updatePageHeight)
      cancelAnimationFrame(frameId)
    }
  }, [listLoading])

  return (
    <div
      ref={pageRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: pageHeight ?? undefined,
        maxHeight: pageHeight ?? undefined,
        overflow: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <HeaderPage
          title={'Ventas'}
          titleButton={can(actions.CREATE) ? 'Nueva nota de servicio' : undefined}
          showDrawer={can(actions.CREATE) ? newNote : undefined}
          permissions={permissions.VENTAS}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <ServiceView
          canEditAndCreate={canEditAndCreate}
          isAdmin={isAdmin}
          onLoadingChange={setListLoading}
        />
      </div>
    </div>
  )
}

export default Sales
