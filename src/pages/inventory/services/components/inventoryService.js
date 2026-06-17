import React, { useCallback, useEffect, useState } from 'react'
import ServicesTable from './servicesTable'
import ServiceDrawer from './serviceDrawer'
import ActionOptions from '../../../../components/actionOptions'
import Tag from '../../../../components/Tag'
import { withRouter } from 'react-router'
import { validateRole } from '../../../../utils'
import { permissions, roles } from '../../../../commons/types'

function InventoryService(props) {
  const [editMode, setEditMode] = useState(false)
  const [editDataDrawer, setEditDataDrawer] = useState(null)
  const [dataSource, setDataSource] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  const columns = [
    { width: 250, title: 'Codigo', dataIndex: 'code', key: 'code' },
    { width: 420, title: 'Descripcion', dataIndex: 'description', key: 'description' },
    {
      width: 120,
      title: 'Categoria',
      dataIndex: 'sales_category',
      key: 'sales_category',
      render: text =>
        text ? <Tag type='salesCategories' value={text} /> : <span>-</span>,
    },
    {
      width: 100,
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: text => <Tag type='productStatus' value={text} />,
    },
    {
      width: 100,
      title: '',
      dataIndex: 'id',
      key: 'id',
      render: (_, data) => (
        <ActionOptions
          editPermissions={false}
          data={data}
          permissionId={permissions.INVENTARIO}
          showDeleteBtn
          handlerDeleteRow={DeleteRow}
          handlerEditRow={EditRow}
        />
      ),
    },
  ]

  const isAdmin = validateRole(roles.ADMIN)

  const loadData = useCallback(() => {
    setDataSource(props.dataSource || [])
  }, [props.dataSource])

  useEffect(() => {
    loadData()
    return () => setIsVisible(false)
  }, [loadData])

  const showDrawer = () => props.history.push('/inventoryServicesView')

  const onClose = () => setIsVisible(false)

  const onCloseAfterSave = () => {
    setIsVisible(false)
    props.clearSearch()
  }

  const EditRow = data => {
    setEditDataDrawer(data)
    setIsVisible(true)
    setEditMode(true)
  }

  const DeleteRow = data => props.deleteItemModule({ id: data.id })

  return (
    <>
      <ServicesTable
        dataSource={dataSource}
        columns={columns}
        loading={props.loading}
        pagination={props.pagination}
        onPaginationChange={props.onPaginationChange}
        onSearchDescription={props.searchByDescription}
        onSearchCode={props.searchByCode}
        onCreate={showDrawer}
      />

      <ServiceDrawer
        warehouse={false}
        closable={onClose}
        visible={isVisible}
        edit={editMode}
        editData={editDataDrawer}
        cancelButton={onClose}
        closeAfterSave={onCloseAfterSave}
        serviceStatusList={props.serviceStatusList}
        isAdmin={isAdmin}
      />
    </>
  )
}

export default withRouter(InventoryService)
