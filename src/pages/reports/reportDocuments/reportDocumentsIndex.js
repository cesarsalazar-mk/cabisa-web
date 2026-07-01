import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { message } from 'antd'
import moment from 'moment'
import HeaderPage from '../../../components/HeaderPage'
import ReportDocumentTable from './components/reportDocumentTable'
import { permissions, documentsPaymentMethods } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'

const emptySummary = {
  total_invoices: 0,
  approved_count: 0,
  cancelled_count: 0,
  approved_total: 0,
  cancelled_total: 0,
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

function getDateRangeFilterReport(dateRange) {
  if (!dateRange) return {}

  return {
    start_date: {
      $gte: moment(dateRange[0]).format('YYYY-MM-DD'),
    },
    end_date: {
      $lte: moment(dateRange[1]).add(1, 'days').format('YYYY-MM-DD'),
    },
  }
}

function ReportDocuments() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      related_internal_document_id: '',
      document_number: '',
      name: '',
      created_at: null,
      paymentMethods: '',
      totalInvoice: '',
    }
  }

  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])

  useEffect(() => {
    setPaymentMethodsOptionsList([
      documentsPaymentMethods.CARD,
      documentsPaymentMethods.CASH,
    ])
  }, [])

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    related_internal_document_id: {
      $like: `%25${filters.related_internal_document_id || ''}%25`,
    },
    name: { $like: `%25${filters.name || ''}%25` },
    document_number: { $like: `%25${filters.document_number || ''}%25` },
    ...getDateRangeFilterReport(filters.created_at),
    payment_method: filters.paymentMethods,
    total_amount: { $like: `%25${filters.totalInvoice || ''}%25` },
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getDocumentReport(getReportParams())
      .then(result => {
        setDataSource(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar reporte facturas'))
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
      link.setAttribute('download', 'Reporte-facturas.xls')
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
      reportType: 'documentReport',
    })
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(_ => message.error('Error al cargar reporte facturas'))
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
          title={'Reporte - Factura Electronica'}
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
        <ReportDocumentTable
          dataSource={dataSource}
          summary={summary}
          filters={filters}
          filtersResetKey={filtersResetKey}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ReportDocuments
