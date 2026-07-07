import React, { useRef, useState, useLayoutEffect } from 'react'
import HeaderPage from '../../../components/HeaderPage'
import InventoryMovementComponent from './components/inventoryMovement'
import { permissions } from '../../../commons/types'

const CONTENT_PADDING_BOTTOM = 24

function getAvailablePageHeight(pageTop) {
  const footer = document.querySelector('.ant-layout-footer')
  const footerHeight = footer?.getBoundingClientRect().height || 30

  return window.innerHeight - pageTop - footerHeight - CONTENT_PADDING_BOTTOM
}

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}

function InventoryMovementIndex() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const [listLoading, setListLoading] = useState(true)

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
          titleButton={''}
          title={'Movimientos de inventario'}
          permissions={permissions.INVENTARIO}
        />
      </div>
      <div style={contentStyle}>
        <InventoryMovementComponent onLoadingChange={setListLoading} />
      </div>
    </div>
  )
}

export default InventoryMovementIndex
