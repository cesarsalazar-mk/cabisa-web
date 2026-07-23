import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react'
import HeaderPage from '../../components/HeaderPage'
import PaymentsTable from './components/manualPaymentsTable'
import PaymentsDetail from './components/manualPaymentsDetail'
import PaymentsSrc from './manualPaymentsSrc'
import PaymentsCreate from './components/manualPaymentsCreate'
import { message } from 'antd'
import { permissions } from '../../commons/types'
import { getDetailData } from '../billing/billingIndex'
import { getSingleDateFilter } from '../../utils'

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
      id: '',
      name: '',
      created_at: null,
      status: '',
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
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      PaymentsSrc.getPaymentMethods(),
      PaymentsSrc.getCreditStatusOptions(),
    ])
      .then(data => {
        setPaymentMethodsOptionsList(data[0])
        setCreditStatusOptionsList(data[1].filter(item => item !== 'DEFAULT'))
      })
      .catch(_ => message.error('Error al cargar listados'))
  }, [])

  const getPaymentsParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    ...(filters.id ? { id: { $like: `%25${filters.id}%25` } } : {}),
    ...(filters.name ? { name: { $like: `%25${filters.name}%25` } } : {}),
    ...getSingleDateFilter(filters.created_at),
    ...(filters.status ? { status: filters.status } : {}),
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

  const handlerDeleteRow = data => {
    setLoading(true)
    PaymentsSrc.removeManualPayment({ id: data.id })
      .then(_ => {
        message.success('Recibo eliminado')
        loadData()
      })
      .catch(error => {
        console.log(error)
        message.error('No se ha podido eliminar el recibo')
        setLoading(false)
      })
  }

  const closeDetail = () => setVisible(false)

  const showDrawerAction = () => {
    setShowModal(true)
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
          titleButton={'Nuevo Recibo'}
          title={'Recibos'}
          permissions={permissions.PAGOS}
          showDrawer={showDrawerAction}
        />
      </div>
      <div style={contentStyle}>
        <PaymentsTable
          dataSource={dataSource}
          handlerEditRow={handlerEditRow}
          handlerDeleteRow={handlerDeleteRow}
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
      <PaymentsCreate
        showModal={showModal}
        hideModal={() => {
          setShowModal(false)
          loadData()
        }}
      />
    </div>
  )
}
export default Payments
