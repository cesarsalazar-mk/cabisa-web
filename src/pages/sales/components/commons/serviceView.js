import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import moment from 'moment'
import { message } from 'antd'

import SalesTable from '../commons/salesTable'
import SalesDetail from '../commons/salesDetail'
import { permissions } from '../../../../commons/types'
import { useSale, saleActions } from '../../context'
import { showErrors } from '../../../../utils'

const { fetchSales, fetchSalesStatus, cancelSale, setSaleState } = saleActions

const defaultPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
}

function ServiceView(props) {
  const history = useHistory()
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      saleId: '',
      startDate: null,
      status: '',
    }
  }

  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [pagination, setPagination] = useState(defaultPagination)
  const [isFetchingSales, setIsFetchingSales] = useState(true)
  const [{ error, status, loading, salesPagination, ...saleState }, saleDispatch] =
    useSale()

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    ...(filters.saleId ? { id: { $like: `%25${filters.saleId}%25` } } : {}),
    ...(filters.startDate
      ? {
          start_date: {
            $like: `%25${moment(filters.startDate).format('YYYY-MM-DD')}%25`,
          },
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const loadData = useCallback(() => {
    setIsFetchingSales(true)
    props.onLoadingChange?.(true)

    fetchSales(saleDispatch, getReportParams())
      .catch(() => {})
      .finally(() => {
        setIsFetchingSales(false)
        props.onLoadingChange?.(false)
      })
  }, [saleDispatch, filters, pagination.current, pagination.pageSize, props.onLoadingChange])

  useEffect(() => {
    fetchSalesStatus(saleDispatch)
  }, [saleDispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPagination(prevState => ({
      ...prevState,
      total: salesPagination?.total || 0,
    }))
  }, [salesPagination?.total])

  useEffect(() => {
    if (isDrawerVisible) return

    if (status === 'ERROR') {
      showErrors(error)
      setSaleState(saleDispatch, { loading: null, error: null, status: 'IDLE' })
    }

    if (status === 'SUCCESS' && loading === 'cancelSale') {
      message.success('Venta cancelada exitosamente')
      loadData()
    }

    if (status === 'SUCCESS' && loading === 'approveSale') {
      message.success('Factura generada exitosamente')
      loadData()
    }
  }, [
    error,
    status,
    loading,
    saleState,
    saleDispatch,
    isDrawerVisible,
    loadData,
  ])

  const setSearchFilters = field => value => {
    const nextValue =
      field === 'startDate' ? value || null : value === undefined || value === null ? '' : value
    setFilters(prevState => ({ ...prevState, [field]: nextValue }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current, startDate: null })
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

  const showDrawer = () => setIsDrawerVisible(true)
  const hideDrawer = () => setIsDrawerVisible(false)

  const handlerEditRow = async currentSale => {
    await setSaleState(saleDispatch, { currentSale })
    showDrawer()
  }

  const handlerApproveRow = row => {
    history.push({
      pathname: '/ServiceNoteBill',
      state: row,
    })
  }

  const handlerDeleteRow = row => {
    cancelSale(saleDispatch, { document_id: row.id })
  }

  const tableLoading =
    isFetchingSales || (status === 'LOADING' && loading === 'cancelSale')

  return (
    <div style={containerStyle}>
      <SalesTable
        dataSource={saleState?.sales}
        filters={filters}
        filtersResetKey={filtersResetKey}
        handleFiltersChange={setSearchFilters}
        onClearFilters={clearFilters}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        salesStatusList={saleState.salesStatusList}
        permissions={permissions.VENTAS}
        handlerDeleteRow={handlerDeleteRow}
        handlerEditRow={handlerEditRow}
        handlerApproveRow={handlerApproveRow}
        warehouse={props.warehouse}
      />
      <SalesDetail
        closable={hideDrawer}
        visible={isDrawerVisible}
        isAdmin={props.isAdmin}
        canEditAndCreate={props.canEditAndCreate}
      />
    </div>
  )
}

export default ServiceView
