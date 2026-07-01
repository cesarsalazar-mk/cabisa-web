import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { message } from 'antd'
import HeaderPage from '../../../components/HeaderPage'
import ReportInventoryTable from './components/reportInventoryTable'
import { permissions } from '../../../commons/types'
import ReportsSrc from '../reportsSrc'
import { showErrors, getDateRangeFilter } from '../../../utils'

const emptySummary = {
  total_items: 0,
  total_value: 0,
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

function ReportInventory() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      code: '',
      description: '',
      dateRange: null,
      product_category: '',
    }
  }

  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [productCategoriesList, setProductCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    ...getDateRangeFilter(filters.dateRange),
    code: { $like: `%25${filters.code || ''}%25` },
    description: { $like: `%25${filters.description || ''}%25` },
    product_category: filters.product_category,
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    ReportsSrc.getInventory(getReportParams())
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
    ReportsSrc.getProductsCategories()
      .then(data => setProductCategoriesList(data))
      .catch(error => showErrors(error))
  }, [])

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
    setFilters({ ...initFilters.current, dateRange: null })
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
      link.setAttribute('download', 'Reporte-inventario.xls')
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
      reportType: 'inventoryReport',
    })
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(error => showErrors(error))
      .finally(() => setLoading(false))
  }

  const exportDataDetailToFile = data => {
    if (!data?.length) return

    setLoading(true)
    ReportsSrc.exportReport({
      ...getReportParams(1, 10, false),
      reportType: 'inventoryReportDetail',
      product_id: data[0].product_id,
    })
      .then(result => exportExcel(result.reportExcel))
      .catch(error => showErrors(error))
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
          titleButton={'Exportar'}
          title={'Reporte - Inventario'}
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
        <ReportInventoryTable
          dataSource={dataSource}
          summary={summary}
          loading={loading}
          filters={filters}
          filtersResetKey={filtersResetKey}
          productCategoriesList={productCategoriesList}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          exportDataDetailToFile={exportDataDetailToFile}
        />
      </div>
    </div>
  )
}

export default ReportInventory
