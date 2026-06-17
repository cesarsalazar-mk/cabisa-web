import React, { useCallback, useEffect, useState } from 'react'
import ProductsTable from './productsTable'
import ProductDrawer from './productDrawer'
import { withRouter } from 'react-router'
import Tag from '../../../../components/Tag'
import ActionOptions from '../../../../components/actionOptions'
import { validateRole } from '../../../../utils'
import { permissions, roles } from '../../../../commons/types'

function InventoryProduct(props) {
  const [editMode, setEditMode] = useState(false)
  const [editDataDrawer, setEditDataDrawer] = useState(null)
  const [dataSource, setDataSource] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  const columns = [
    {
      width: 120,
      title: 'Codigo',
      dataIndex: 'code',
      key: 'code',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: '# Serie',
      dataIndex: 'serial_number',
      key: 'serial_number',
      render: text => <span>{text}</span>,
    },
    {
      width: 350,
      title: 'Descripcion',
      dataIndex: 'description',
      key: 'description',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: 'Categoria',
      dataIndex: 'product_category',
      key: 'product_category',
      render: text => <Tag type='productCategories' value={text} />,
    },
    {
      width: 120,
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: text => <Tag type='productStatus' value={text} />,
    },
    {
      width: 120,
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

  const showDrawer = () => props.history.push('/inventoryProductsView')

  const onClose = () => setIsVisible(false)

  const onCloseAfterSaveWarehouse = () => {
    setIsVisible(false)
    props.closeAfterSaveWareHouse()
  }

  const EditRow = data => {
    setEditDataDrawer(data)
    setIsVisible(true)
    setEditMode(true)
  }

  const DeleteRow = data => props.deleteItemWareHouse({ id: data.id })

  return (
    <>
      <ProductsTable
        dataSource={dataSource}
        columns={columns}
        loading={props.loading}
        pagination={props.pagination}
        onPaginationChange={props.onPaginationChange}
        onSearchDescription={props.searchByTxt}
        onSearchCode={props.searchByTxtCode}
        onSearchCategory={props.searchByCategory}
        categoryFilter={props.categoryFilter}
        productCategoriesList={props.productCategoriesList}
        onCreate={showDrawer}
      />

      <ProductDrawer
        warehouse={true}
        closable={onClose}
        visible={isVisible}
        edit={editMode}
        editData={editDataDrawer}
        cancelButton={onClose}
        closeAfterSave={onCloseAfterSaveWarehouse}
        productStatusList={props.productStatusList}
        productCategoriesList={props.productCategoriesList}
        productsTaxesList={props.productsTaxesList}
        isAdmin={isAdmin}
      />
    </>
  )
}

export default withRouter(InventoryProduct)
