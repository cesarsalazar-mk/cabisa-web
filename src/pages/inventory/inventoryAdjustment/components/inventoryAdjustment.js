import React, { useEffect, useCallback, useState, useRef } from 'react'
import { useHistory } from 'react-router'
import { message } from 'antd'
import ActionOptions from '../../../../components/actionOptions'
import InventoryAdjustmentTable from './inventoryAdjustmentTable'
import InventoryAdjustmentDrawer from './inventoryAdjustmentDrawer'
import inventorySrc from '../../inventorySrc'
import { validateRole, formatGuatemalaDate, getSingleDateFilter } from '../../../../utils'
import { permissions, roles } from '../../../../commons/types'

const getColumns = ({ EditRow }) => [
  {
    title: 'Fecha',
    dataIndex: 'created_at', // Field that is goint to be rendered
    key: 'created_at',
    render: text =>
      text ? <span>{formatGuatemalaDate(text)}</span> : '',
  },
  {
    title: '',
    dataIndex: 'id', // Field that is goint to be rendered
    key: 'id',
    render: (_, data) => (
      <ActionOptions
        editPermissions={false}
        data={data}
        permissionId={permissions.INVENTARIO}
        handlerEditRow={EditRow}
        editAction='show'
      />
    ),
  },
]

function InventoryAdjustmentComponent() {
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      created_at: '',
    }
  }

  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [editDataDrawer, setEditDataDrawer] = useState(null)
  const [filters, setFilters] = useState(initFilters.current)

  const isAdmin = validateRole(roles.ADMIN)

  const loadData = useCallback(() => {
    setLoading(true)

    inventorySrc
      .getAdjustments({
        ...getSingleDateFilter(filters.created_at),
      })
      .then(data => setDataSource(data))
      .catch(_ => message.error('Error al cargar facturas'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setSearchFilters = field => value =>
    setFilters(prevState => ({ ...prevState, [field]: value }))

  const goCreateNewItem = () => history.push('/inventoryAdjustmentView')

  const onClose = () => setIsVisible(false)

  const EditRow = data => {
    setEditDataDrawer(data)
    setIsVisible(true)
  }

  const columns = getColumns({ EditRow, isAdmin })

  return (
    <>
      <InventoryAdjustmentTable
        columns={columns}
        loading={loading}
        dataSource={dataSource}
        goCreateNewItem={goCreateNewItem}
        handleFiltersChange={setSearchFilters}
      />
      <InventoryAdjustmentDrawer
        closable={onClose}
        visible={isVisible}
        editData={editDataDrawer}
        forbidEdition={true}
      />
    </>
  )
}

export default InventoryAdjustmentComponent
