import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react'
import moment from 'moment'
import HeaderPage from '../../components/HeaderPage'
import PaymentsTable from './components/paymentsTable'
import PaymentsDetail from './components/paymentsDetail'
import PaymentsSrc from './paymentsSrc'
import { message } from 'antd'
import { documentsStatus, permissions } from '../../commons/types'
import { getDetailData } from '../billing/billingIndex'

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

function Payments() {
  const pageRef = useRef(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      related_internal_document_id: '',
      document_number: '',
      id: '',
      name: '',
      nit: '',
      created_at: null,
      paymentMethods: '',
      totalInvoice: '',
      creditStatus: '',
    }
  }

  const [pageHeight, setPageHeight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [detailData, setDetailData] = useState(null)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [pagination, setPagination] = useState(defaultPagination)
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

  const getPaymentsParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    status: { $ne: documentsStatus.CANCELLED },
    ...(filters.related_internal_document_id
      ? {
          related_internal_document_id: {
            $like: `%25${filters.related_internal_document_id}%25`,
          },
        }
      : {}),
    ...(filters.document_number
      ? { document_number: { $like: `%25${filters.document_number}%25` } }
      : {}),
    ...(filters.id ? { id: { $like: `%25${filters.id}%25` } } : {}),
    ...(filters.name ? { name: { $like: `%25${filters.name}%25` } } : {}),
    ...(filters.nit ? { nit: { $like: `%25${filters.nit}%25` } } : {}),
    ...(filters.created_at
      ? {
          created_at: {
            $like: `${moment(filters.created_at).format('YYYY-MM-DD')}%25`,
          },
        }
      : {}),
    ...(filters.paymentMethods ? { payment_method: filters.paymentMethods } : {}),
    ...(filters.totalInvoice
      ? { total_amount: { $like: `%25${filters.totalInvoice}%25` } }
      : {}),
    ...(filters.creditStatus ? { credit_status: filters.creditStatus } : {}),
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const loadData = useCallback(() => {
    setLoading(true)

    PaymentsSrc.getPayments(getPaymentsParams())
      .then(result => {
        setDataSource(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar facturas'))
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
    const nextValue =
      field === 'created_at'
        ? value || null
        : value === undefined || value === null
        ? ''
        : value
    setFilters(prevState => ({ ...prevState, [field]: nextValue }))
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

  const handlerEditRow = data => {
    const detail = getDetailData(data)

    setDetailData(detail)
    setVisible(true)
  }

  const closeDetail = () => setVisible(false)

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
        <HeaderPage title={'Recibo de caja'} permissions={permissions.PAGOS} />
      </div>
      <div style={contentStyle}>
        <PaymentsTable
          dataSource={dataSource}
          handlerEditRow={handlerEditRow}
          handleFiltersChange={setSearchFilters}
          filters={filters}
          filtersResetKey={filtersResetKey}
          onClearFilters={clearFilters}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          creditStatusOptionsList={creditStatusOptionsList}
          loading={loading}
        />
      </div>
      <PaymentsDetail
        closable={closeDetail}
        visible={visible}
        loading={loading}
        setLoading={setLoading}
        detailData={detailData}
        loadData={loadData}
        paymentMethodsOptionsList={paymentMethodsOptionsList}
      />
    </div>
  )
}
export default Payments
