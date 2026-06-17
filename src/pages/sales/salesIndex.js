import React, { useRef, useState, useLayoutEffect } from 'react'
import HeaderPage from '../../components/HeaderPage'
import SalesTabIndex from './components/salesTabIndex'
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
  const [pageHeight, setPageHeight] = useState(null)
  const can = validatePermissions(permissions.VENTAS)
  const canEditAndCreate = can(actions.CREATE) || can(actions.EDIT)
  const isAdmin = validateRole(roles.ADMIN) || validateRole(roles.SELLS)

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
  }, [])

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
        <HeaderPage title={'Ventas'} />
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
        <SalesTabIndex canEditAndCreate={canEditAndCreate} isAdmin={isAdmin} />
      </div>
    </div>
  )
}

export default Sales
