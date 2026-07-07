import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import { message } from 'antd'
import HeaderPage from '../../components/HeaderPage'
import ClientTable from './components/clientTable'
import ClientsDrawer from '../clients/components/clientsDrawer'

import ClientsSrc from './clientsSrc'
import { permissions } from '../../commons/types'

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

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}

function Clients(props) {
  const pageRef = useRef(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      searchText: '',
    }
  }

  const [pageHeight, setPageHeight] = useState(null)
  const [visible, setVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editDataDrawer, setEditDataDrawer] = useState(null)
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [pagination, setPagination] = useState(defaultPagination)

  const getClientsParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    ...(filters.searchText
      ? {
          open_parenthesis: 'name',
          close_parenthesis: 'nit',
          name: { $like: `%25${filters.searchText}%25` },
          nit: { $or: true, $like: `%25${filters.searchText}%25` },
        }
      : {}),
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const loadData = useCallback(() => {
    setLoading(true)
    setVisible(false)

    ClientsSrc.getClients(getClientsParams())
      .then(result => {
        setDataSource(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(err => {
        console.log(err)
        message.error('No se pudo obtener la informacion.')
      })
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

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
  }, [loading, dataSource])

  const setSearchFilters = field => value => {
    setFilters(prevState => ({ ...prevState, [field]: value ?? '' }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current })
    setPagination(prevState => ({ ...prevState, current: 1 }))
    setFiltersResetKey(prevState => prevState + 1)
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const showDrawer = () => props.history.push('/clientView')

  const onClose = () => setVisible(false)

  const EditRow = data => {
    setEditDataDrawer(data)
    setVisible(true)
    setEditMode(true)
  }

  const DeleteRow = data => {
    setLoading(true)

    ClientsSrc.deleteClient(data.id)
      .then(_ => {
        message.success('Elemento eliminado.')
        loadData()
      })
      .catch(err => {
        console.log('DELETE CLIENTE ERROR', err)
        message.warning('No se pudo eliminar el elemento seleccionado.')
        setLoading(false)
      })
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
          titleButton={'Nuevo Cliente'}
          title={'Clientes'}
          showDrawer={showDrawer}
          permissions={permissions.CLIENTES}
        />
      </div>
      <div style={contentStyle}>
        <ClientTable
          dataSource={dataSource}
          loading={loading}
          filters={filters}
          filtersResetKey={filtersResetKey}
          pagination={pagination}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          onPaginationChange={handlePaginationChange}
          handlerEditRow={EditRow}
          handlerDeleteRow={DeleteRow}
        />
      </div>
      <ClientsDrawer
        closable={onClose}
        visible={visible}
        edit={editMode}
        editData={editDataDrawer}
        cancelButton={onClose}
        loadData={loadData}
      />
    </div>
  )
}

export default Clients
