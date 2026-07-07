import React, { useEffect, useCallback, useState, useRef } from 'react'
import moment from 'moment'
import { useHistory } from 'react-router'
import { message } from 'antd'
import ActionOptions from '../../../../components/actionOptions'
import InventoryMovementTable from './inventoryMovementTable'
import InventoryMovementDrawer from './inventoryMovementDrawer'
import inventorySrc from '../../inventorySrc'
import Tag from '../../../../components/Tag'
import { showErrors, validateRole } from '../../../../utils'
import { permissions, documentsStatus, roles } from '../../../../commons/types'

const defaultPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}

const getColumns = ({ DeleteRow, EditRow, isAdmin }) => [
  {
    width: 120,
    title: 'Fecha',
    dataIndex: 'start_date',
    key: 'start_date',
    render: text =>
      text ? <span>{moment(text).format('DD-MM-YYYY')}</span> : '',
  },
  {
    width: 120,
    title: 'Nro Documento',
    dataIndex: 'related_external_document_id',
    key: 'related_external_document_id',
  },
  {
    width: 350,
    title: 'Proveedor',
    dataIndex: 'stakeholder_name',
    key: 'stakeholder_name',
  },
  {
    width: 120,
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: text => <Tag type='documentStatus' value={text} />,
  },
  {
    width: 200,
    title: '',
    dataIndex: 'id',
    key: 'id',
    render: (_, data) => (
      <ActionOptions
        editPermissions={false}
        data={data}
        permissionId={permissions.INVENTARIO}
        showDeleteBtn={data.status !== documentsStatus.CANCELLED}
        handlerDeleteRow={DeleteRow}
        handlerEditRow={EditRow}
        editAction={
          isAdmin && data.status !== documentsStatus.CANCELLED ? 'edit' : 'show'
        }
        deleteAction='cancel'
      />
    ),
  },
]

function InventoryMovementComponent({ onLoadingChange }) {
  const history = useHistory()
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      documentNumber: '',
      status: '',
    }
  }

  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [pagination, setPagination] = useState(defaultPagination)
  const [editDataDrawer, setEditDataDrawer] = useState(null)

  const isAdmin = validateRole(roles.ADMIN)

  const getPurchasesParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    ...(filters.documentNumber
      ? {
          related_external_document_id: {
            $like: `%25${filters.documentNumber}%25`,
          },
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const loadData = useCallback(() => {
    setLoading(true)
    onLoadingChange?.(true)

    inventorySrc
      .getPurchases(getPurchasesParams())
      .then(result => {
        setDataSource(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(error => showErrors(error))
      .finally(() => {
        setLoading(false)
        onLoadingChange?.(false)
      })
  }, [filters, pagination.current, pagination.pageSize, onLoadingChange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setSearchFilters = field => value => {
    setFilters(prevState => ({
      ...prevState,
      [field]: value === undefined || value === null ? '' : value,
    }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current })
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

  const goCreateNewItem = () => history.push('/inventoryMovementsView')

  const onClose = () => setIsVisible(false)

  const EditRow = data => {
    setEditDataDrawer(data)
    setIsVisible(true)
  }

  const DeleteRow = data => {
    setLoading(true)
    onLoadingChange?.(true)

    inventorySrc
      .cancelPurchase({ document_id: data.id })
      .then(_ => {
        message.success('Compra anulada exitosamente')
        loadData()
      })
      .catch(error => showErrors(error))
      .finally(() => {
        setLoading(false)
        onLoadingChange?.(false)
      })
  }

  const columns = getColumns({ DeleteRow, EditRow, isAdmin })

  return (
    <>
      <InventoryMovementTable
        columns={columns}
        loading={loading}
        dataSource={dataSource}
        filters={filters}
        filtersResetKey={filtersResetKey}
        pagination={pagination}
        handleFiltersChange={setSearchFilters}
        onClearFilters={clearFilters}
        onPaginationChange={handlePaginationChange}
        goCreateNewItem={goCreateNewItem}
      />

      <InventoryMovementDrawer
        closable={onClose}
        visible={isVisible}
        editData={editDataDrawer}
        forbidEdition={
          !isAdmin || editDataDrawer?.status === documentsStatus.CANCELLED
        }
        getPurchases={loadData}
      />
    </>
  )
}

export default InventoryMovementComponent
