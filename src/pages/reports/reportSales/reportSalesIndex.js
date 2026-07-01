import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { message } from 'antd'
import HeaderPage from '../../../components/HeaderPage'
import ReportSalesTable from './components/reportSalesTable'
import { permissions, stakeholdersStatus, stakeholdersTypes } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'
import { showErrors, getDateRangeFilter } from '../../../utils'

const emptySummary = {
  total_documents: 0,
  total_billed: 0,
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

function ReportSales() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      dateRange: null,
      payment_method: '',
      document_type: '',
      seller_id: null,
      client_id: null,
    }
  }

  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])
  const [sellersOptionsList, setSellersOptionsList] = useState([])
  const [stakeholdersOptionsList, setStakeholdersOptionsList] = useState([])

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    ...getDateRangeFilter(filters.dateRange),
    payment_method: filters.payment_method,
    document_type: filters.document_type,
    seller_id: filters.seller_id,
    client_id: filters.client_id,
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getSales(getReportParams())
      .then(result => {
        setDataSource(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(error => showErrors(error))
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    ReportsSrc.getPaymentMethods()
      .then(data => setPaymentMethodsOptionsList(data))
      .catch(_ => message.error('Error al cargar listados'))
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
  }, [loading, summary, dataSource])

  const setSearchFilters = field => value => {
    let nextValue = value ?? ''
    if ((field === 'client_id' || field === 'seller_id') && !value) {
      nextValue = null
    }
    setFilters(prevState => ({ ...prevState, [field]: nextValue }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current, dateRange: null, client_id: null, seller_id: null })
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

  const handleSearchSeller = (seller_name = '') => {
    setLoading(true)
    ReportsSrc.getSellersOptions({
      full_name: { $like: `%25${seller_name}%25` },
      rol_id: { $in: '1,2' },
      is_active: 1,
    })
      .then(data => setSellersOptionsList(data))
      .catch(_ => message.error('Error al cargar listado de vendedores'))
      .finally(() => setLoading(false))
  }

  const handleSearchStakeholder = stakeholder_name => {
    setLoading(true)
    ReportsSrc.getStakeholdersOptions({
      name: { $like: `%25${stakeholder_name}%25` },
      status: stakeholdersStatus.ACTIVE,
      stakeholder_type: { $ne: stakeholdersTypes.PROVIDER },
    })
      .then(data => setStakeholdersOptionsList(data))
      .catch(_ => message.error('Error al cargar listado de clientes'))
      .finally(() => setLoading(false))
  }

  const exportExcel = base64Excel => {
    try {
      const uri = `data:application/octet-stream;base64,${base64Excel}`
      const link = document.createElement('a')
      link.setAttribute('download', 'Reporte-Orden-servicio.xls')
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

  const exportDataAction = () => {
    setLoading(true)
    ReportsSrc.exportReport({
      ...getReportParams(1, 10, false),
      reportType: 'salesReport',
    })
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(_ => message.error('Error al cargar reporte ventas'))
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
          title={'Reporte - Ordenes de servicio / Ventas'}
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
        <ReportSalesTable
          dataSource={dataSource}
          summary={summary}
          loading={loading}
          filters={filters}
          filtersResetKey={filtersResetKey}
          setSearchFilters={setSearchFilters}
          onClearFilters={clearFilters}
          handleSearchSeller={handleSearchSeller}
          sellersOptionsList={sellersOptionsList}
          handleSearchStakeholder={handleSearchStakeholder}
          stakeholdersOptionsList={stakeholdersOptionsList}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ReportSales
