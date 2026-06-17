import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react'
import HeaderPage from '../../../components/HeaderPage'
import InventoryService from './components/inventoryService'
import InventorySrc from '../inventorySrc'
import { message } from 'antd'
import { showErrors } from '../../../utils'
import { permissions } from '../../../commons/types'

const defaultPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}

const CONTENT_PADDING_BOTTOM = 24

function getAvailablePageHeight(pageTop) {
  const footer = document.querySelector('.ant-layout-footer')
  const footerHeight = footer?.getBoundingClientRect().height || 30

  return window.innerHeight - pageTop - footerHeight - CONTENT_PADDING_BOTTOM
}

function ServiceIndex() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const [inventoryServices, setInventoryServices] = useState([])
  const [serviceStatusList, setServiceStatusList] = useState([])
  const [searchText, setSearchText] = useState('')
  const [searchCode, setSearchCode] = useState('')
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(false)

  const getServiceParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    description: { $like: `%25${searchText}%25` },
    code: { $like: `%25${searchCode}%25` },
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const getServices = useCallback(() => {
    setLoading(true)

    InventorySrc.getServices(getServiceParams())
      .then(result => {
        setInventoryServices(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(err => {
        console.log('ERROR ON GET INVENTORY SERVICES', err)
        message.warning('No se ha podido obtener informacion del inventario.')
      })
      .finally(() => setLoading(false))
  }, [searchText, searchCode, pagination.current, pagination.pageSize])

  useEffect(() => {
    getServices()
  }, [getServices])

  useEffect(() => {
    setLoading(true)

    InventorySrc.getServicesStatus()
      .then(result => setServiceStatusList(result))
      .catch(err => {
        console.log('ERROR ON GET INVENTORY SERVICES', err)
        message.warning('No se ha podido obtener informacion del inventario.')
      })
      .finally(() => setLoading(false))
  }, [])

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
  }, [loading, inventoryServices])

  const searchByDescription = description => {
    setSearchText(description)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const searchByCode = code => {
    setSearchCode(code)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const clearSearch = () => {
    setSearchText('')
    setSearchCode('')
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const deleteService = data => {
    setLoading(true)

    InventorySrc.deleteService(data)
      .then(_ => {
        message.success('Elemento eliminado')
        clearSearch()
      })
      .catch(err => showErrors(err))
      .finally(() => setLoading(false))
  }

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
          title={'Servicios'}
          permissions={permissions.INVENTARIO}
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
        <InventoryService
          title={'Servicios'}
          searchByDescription={searchByDescription}
          searchByCode={searchByCode}
          clearSearch={clearSearch}
          dataSource={inventoryServices}
          deleteItemModule={deleteService}
          serviceStatusList={serviceStatusList}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ServiceIndex
