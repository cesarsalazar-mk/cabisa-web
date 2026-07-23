import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { message } from 'antd'
import HeaderPage from '../../../components/HeaderPage'
import ReportManualCashReceiptsTable from './components/reportManualCashReceiptsTable'
import { permissions } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'
import PaymentsSrc from '../../payments/paymentsSrc'
import { getDateRangeFilter } from '../../../utils'

const emptySummary = {
  total_receipts: 0,
  total_billed: 0,
  total_paid: 0,
  total_balance: 0,
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

function ReportManualCashReceipts() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      id: '',
      name: '',
      nit: '',
      created_at: null,
      paymentMethods: '',
      totalInvoice: '',
      status: '',
    }
  }

  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])
  const [creditStatusOptionsList, setCreditStatusOptionsList] = useState([])

  useEffect(() => {
    Promise.all([
      PaymentsSrc.getPaymentMethods(),
      PaymentsSrc.getCreditStatusOptions(),
    ])
      .then(data => {
        setPaymentMethodsOptionsList(data[0])
        setCreditStatusOptionsList(data[1])
      })
      .catch(_ => message.error('Error al cargar listados'))
  }, [])

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    id: { $like: `%25${filters.id || ''}%25` },
    name: { $like: `%25${filters.name || ''}%25` },
    nit: { $like: `%25${filters.nit || ''}%25` },
    ...getDateRangeFilter(filters.created_at),
    payment_method: filters.paymentMethods,
    total_amount: { $like: `%25${filters.totalInvoice || ''}%25` },
    status: filters.status,
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getManualCashReceipts(getReportParams())
      .then(result => {
        setDataSource(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar reporte recibos manuales'))
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
    setFilters(prevState => ({ ...prevState, [field]: value ?? '' }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current, created_at: null })
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

  const exportExcel = base64Excel => {
    try {
      const uri = `data:application/octet-stream;base64,${base64Excel}`
      const link = document.createElement('a')
      link.setAttribute('download', 'Reporte-Recibos-Manuales.xls')
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
      reportType: 'manualCashReceipts',
    })
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(_ => message.error('Error al cargar reporte recibos manuales'))
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
          title={'Reporte - Recibos manuales'}
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
        <ReportManualCashReceiptsTable
          dataSource={dataSource}
          summary={summary}
          filters={filters}
          filtersResetKey={filtersResetKey}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          creditStatusOptionsList={creditStatusOptionsList}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ReportManualCashReceipts
