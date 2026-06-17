import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import HeaderPage from '../../../components/HeaderPage'
import { withRouter } from 'react-router'
import ReportSalesProductTable from './components/reportSalesProductTable'
import { permissions, reportSalesItemTypes } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'
import { message } from 'antd'
import moment from 'moment'

const emptySummary = {
  top_product: null,
  top_service: null,
  top_equipment: null,
  products_total_quantity: 0,
  services_total_quantity: 0,
  equipment_total_quantity: 0,
  products_total_amount: 0,
  services_total_amount: 0,
  equipment_total_amount: 0,
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

function ReportSalesProduct(props) {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      code: '',
      description: '',
      created_at: '',
      item_type: '',
      sales_category: '',
    }
  }

  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)

  const getDateRangeFilterReport = dateRange => {
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

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    code: { $like: `%25${filters.code}%25` },
    description: { $like: `%25${filters.description}%25` },
    ...getDateRangeFilterReport(filters.created_at),
    ...(filters.item_type ? { item_type: filters.item_type } : {}),
    ...(filters.sales_category ? { sales_category: filters.sales_category } : {}),
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const exportDataAction = () => {
    setLoading(true)
    const params = {
      ...getReportParams(1, 10, false),
      reportType: 'salesProducts',
    }

    ReportsSrc.exportReport(params)
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(_ => message.error('Error al cargar reporte productos vendidos'))
      .finally(() => setLoading(false))
  }

  const exportExcel = base64Excel => {
    try {
      const uri = `data:application/octet-stream;base64,${base64Excel}`
      const link = document.createElement('a')
      link.setAttribute('download', 'Reporte-productos-vendidos.xls')
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

  const setSearchFilters = field => value => {
    setFilters(prevState => ({ ...prevState, [field]: value }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getSalesProductReport(getReportParams())
      .then(data => {
        setDataSource(data.items || data)
        setSummary(data.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: data.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar reporte Venta de productos'))
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

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
  }, [loading, summary])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          title={'Reporte - Ventas'}
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
        <ReportSalesProductTable
          dataSource={dataSource}
          summary={summary}
          handleFiltersChange={setSearchFilters}
          loading={loading}
          itemTypeFilter={filters.item_type}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isAdmin={true}
        />
      </div>
    </div>
  )
}

export default withRouter(ReportSalesProduct)
