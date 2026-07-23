import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { useHistory } from 'react-router-dom'
import { message } from 'antd'
import HeaderPage from '../../../components/HeaderPage'
import ReportServiceOrderTable from './components/reportServiceOrderTable'
import SalesDetail from '../../sales/components/commons/salesDetail'
import { permissions } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'
import { getSingleDateFilter } from '../../../utils'

const emptySummary = {
  total_orders: 0,
  approved_count: 0,
  pending_count: 0,
  cancelled_count: 0,
}

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

function ReportServiceOrders() {
  const pageRef = useRef(null)
  const history = useHistory()
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      id: '',
      name: '',
      start_date: null,
      status: '',
    }
  }

  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    ...(filters.id ? { id: { $like: `%25${filters.id}%25` } } : {}),
    ...(filters.name ? { name: { $like: `%25${filters.name}%25` } } : {}),
    ...getSingleDateFilter(filters.start_date),
    ...(filters.status ? { status: filters.status } : {}),
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getServiceOrders(getReportParams())
      .then(result => {
        setDataSource(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(() => message.error('Error al cargar ordenes de servicio'))
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
  }, [loading, summary, dataSource])

  const setSearchFilters = field => value => {
    const nextValue =
      field === 'start_date' ? value || null : value === undefined || value === null ? '' : value
    setFilters(prevState => ({ ...prevState, [field]: nextValue }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current, start_date: null })
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

  const exportDataAction = () => {
    setLoading(true)
    ReportsSrc.exportReport({
      ...getReportParams(1, 10, false),
      reportType: 'serviceOrders',
    })
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(() => message.error('Error al exportar ordenes de servicio'))
      .finally(() => setLoading(false))
  }

  const exportExcel = base64Excel => {
    try {
      const uri = `data:application/octet-stream;base64,${base64Excel}`
      const link = document.createElement('a')
      link.setAttribute('download', 'Reporte-Notas-de-Servicio.xls')
      link.setAttribute('href', uri)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(document.body.lastChild)
    } catch (e) {
      console.log('ERROR ON EXPORT MANIFEST', e)
      message.warning('Error al exportar el manifiesto')
    } finally {
      setLoading(false)
    }
  }

  const showDrawer = () => setIsDrawerVisible(true)
  const hideDrawer = () => setIsDrawerVisible(false)

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
          title={'Reporte - Ordenes De Servicio'}
          titleButton={'Exportar'}
          permissions={permissions.REPORTES}
          showDrawer={exportDataAction}
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
        <ReportServiceOrderTable
          dataSource={dataSource}
          summary={summary}
          loading={loading}
          filters={filters}
          filtersResetKey={filtersResetKey}
          setSearchFilters={setSearchFilters}
          onClearFilters={clearFilters}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          permissions={permissions.REPORTES}
          isDrawerVisible={isDrawerVisible}
          showDrawer={showDrawer}
          history={history}
          loadData={loadData}
        />
      </div>
      <SalesDetail
        closable={hideDrawer}
        visible={isDrawerVisible}
        isAdmin={false}
        canEditAndCreate={false}
      />
    </div>
  )
}

export default ReportServiceOrders
