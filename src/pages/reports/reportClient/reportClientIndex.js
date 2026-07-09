import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import moment from 'moment'
import { message } from 'antd'
import HeaderPage from '../../../components/HeaderPage'
import ReportClientTable from './components/reportClientTable'
import ReportsSrc from '../reportsSrc'
import { showErrors } from '../../../utils'
import { stakeholdersTypes, permissions } from '../../../commons/types'

const emptySummary = {
  total_clients: 0,
  clients_with_debt: 0,
  clients_without_debt: 0,
  total_credit: 0,
  total_paid_credit: 0,
  total_credit_balance: 0,
  total_debt_balance: 0,
  total_debt_charge: 0,
  total_debt_paid: 0,
  total_without_debt_balance: 0,
  total_without_debt_charge: 0,
  total_without_debt_paid: 0,
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

function getClientDateRangeFilter(dateRange) {
  if (!dateRange) return {}

  return {
    start_date: {
      $gte: moment(dateRange[0]).format('YYYY-MM-DD'),
    },
    end_date: {
      $lte: moment(dateRange[1]).format('YYYY-MM-DD'),
    },
  }
}

function ReportClient() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      created_at: null,
      name: '',
      stakeholder_type: '',
      debt_status: '',
    }
  }

  const [clients, setClients] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [stakeholderTypesOptionsList, setStakeholderTypesOptionsList] = useState(
    []
  )
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    ...getClientDateRangeFilter(filters.created_at),
    name: { $like: `%25${filters.name}%25` },
    stakeholder_type: filters.stakeholder_type,
    ...(filters.debt_status ? { debt_status: filters.debt_status } : {}),
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const fetchClients = useCallback(() => {
    setLoading(true)
    ReportsSrc.getClientsAccountState(getReportParams())
      .then(result => {
        setClients(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(error => showErrors(error))
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

  const fetchClientTypes = () => {
    ReportsSrc.getClientTypes()
      .then(data => {
        const stakeholdersTypesList = data.filter(
          s => s !== stakeholdersTypes.PROVIDER
        )
        setStakeholderTypesOptionsList(stakeholdersTypesList)
      })
      .catch(error => showErrors(error))
  }

  useEffect(() => {
    if (stakeholderTypesOptionsList.length === 0) fetchClientTypes()
  }, [stakeholderTypesOptionsList.length])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

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
  }, [loading, summary, clients])

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

  const exportDataAction = () => {
    setLoading(true)
    const params = {
      ...getReportParams(1, 10, false),
      stakeholder_type: filters.stakeholder_type
        ? filters.stakeholder_type
        : { $ne: stakeholdersTypes.PROVIDER },
      status: 'ACTIVE',
      reportType: 'clientReport',
    }

    ReportsSrc.exportReport(params)
      .then(data => {
        message.success('Reporte creado')
        exportExcel(data.reportExcel)
      })
      .catch(_ => message.error('Error al cargar reporte facturas'))
      .finally(() => setLoading(false))
  }

  const exportExcel = base64Excel => {
    try {
      const uri = `data:application/octet-stream;base64,${base64Excel}`
      const link = document.createElement('a')
      link.setAttribute('download', 'Reporte-Cuenta-Clientes.xls')
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
          title={'Reporte - Estado de cuenta clientes'}
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
        <ReportClientTable
          dataSource={clients}
          summary={summary}
          stakeholderTypesOptionsList={stakeholderTypesOptionsList}
          handleFiltersChange={setSearchFilters}
          filters={filters}
          filtersResetKey={filtersResetKey}
          onClearFilters={clearFilters}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ReportClient
