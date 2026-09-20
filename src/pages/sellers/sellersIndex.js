import React, { useCallback, useEffect, useState } from 'react'
import { Button, Card, Col, Input, InputNumber, message, Modal, Pagination, Row, Table } from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import HeaderPage from '../../components/HeaderPage'
import ActionOptions from '../../components/actionOptions'
import SellersSrc from './sellersSrc'
import { permissions } from '../../commons/types'
import { formatPhone, formatPhoneOnChange, showErrors, validateEmail } from '../../utils'

const { Search } = Input

const DEFAULT_COMMISSION = 5
const emptySeller = { name: '', email: '', phone: '', commission_percentage: DEFAULT_COMMISSION }

function Sellers() {
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [seller, setSeller] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)

    SellersSrc.getSellers({
      ...(searchText
        ? {
            open_parenthesis: 'name',
            close_parenthesis: 'email',
            name: { $like: `%25${searchText}%25` },
            email: { $or: true, $like: `%25${searchText}%25` },
          }
        : {}),
      $limit: pagination.pageSize,
      $offset: (pagination.current - 1) * pagination.pageSize,
    })
      .then(result => {
        setDataSource(result.items)
        setPagination(prev => ({ ...prev, total: result.pagination.total }))
      })
      .catch(() => message.error('No se pudo obtener la informacion.'))
      .finally(() => setLoading(false))
  }, [searchText, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setField = field => value => setSeller(prev => ({ ...prev, [field]: value }))

  const openEdit = data => setSeller({ ...data, phone: formatPhone(data.phone), commission_percentage: Number(data.commission_percentage) })

  const onSave = () => {
    const errors = []

    if (!seller.name) errors.push('El campo Nombre es obligatorio')
    if (seller.email && !validateEmail(seller.email)) errors.push('Ingrese un email valido')
    if (seller.commission_percentage === null || seller.commission_percentage === undefined) errors.push('El campo Comision es obligatorio')
    if (errors.length > 0) return showErrors({ message: errors })

    const data = { ...seller, phone: (seller.phone || '').replace(/-/g, '') }
    const save = seller.id ? SellersSrc.updateSeller : SellersSrc.createSeller

    setSaving(true)
    save(data)
      .then(() => {
        message.success(seller.id ? 'Vendedor actualizado' : 'Vendedor creado')
        setSeller(null)
        loadData()
      })
      .catch(showErrors)
      .finally(() => setSaving(false))
  }

  const onDelete = data => {
    setLoading(true)

    SellersSrc.deleteSeller(data.id)
      .then(() => {
        message.success('Elemento eliminado.')
        loadData()
      })
      .catch(() => {
        message.warning('No se pudo eliminar el elemento seleccionado.')
        setLoading(false)
      })
  }

  const clearFilters = () => {
    setSearchText('')
    setSearchKey(prev => prev + 1)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telefono', dataIndex: 'phone', key: 'phone', render: text => formatPhone(text) },
    { title: 'Comision', dataIndex: 'commission_percentage', key: 'commission_percentage', render: v => `${Number(v)}%` },
    {
      title: '',
      key: 'actions',
      render: (_, data) => (
        <ActionOptions
          editPermissions={false}
          data={data}
          permissionId={permissions.VENTAS}
          showDeleteBtn
          handlerDeleteRow={onDelete}
          handlerEditRow={openEdit}
        />
      ),
    },
  ]

  return (
    <div>
      <HeaderPage titleButton={'Nuevo Vendedor'} title={'Vendedores'} showDrawer={() => setSeller({ ...emptySeller })} permissions={permissions.VENTAS} />
      <Row gutter={16} className={'margin-top-15'}>
        <Col xs={24} sm={12} md={8} lg={8}>
          <Search
            key={`seller-search-${searchKey}`}
            prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
            placeholder='Busca por Nombre o Email'
            className={'cabisa-table-search customSearch'}
            size={'large'}
            onSearch={value => {
              setSearchText(value)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={3} lg={3}>
          <Button type='default' className='cabisa-clear-filters-button' style={{ width: '100%', height: '40px' }} onClick={clearFilters} icon={<CloseSquareOutlined />}>
            Limpiar
          </Button>
        </Col>
      </Row>
      <Card className={'card-border-radius margin-top-15'}>
        <Table pagination={false} className={'CustomTableClass'} dataSource={dataSource} columns={columns} loading={loading} rowKey='id' />
        <Pagination
          style={{ marginTop: 12, textAlign: 'right' }}
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger
          pageSizeOptions={['5', '10', '20', '50']}
          onChange={(current, pageSize) => setPagination(prev => ({ ...prev, current, pageSize }))}
          onShowSizeChange={(current, pageSize) => setPagination(prev => ({ ...prev, current, pageSize }))}
        />
      </Card>
      <Modal
        title={seller?.id ? 'Editar Vendedor' : 'Nuevo Vendedor'}
        visible={!!seller}
        onOk={onSave}
        onCancel={() => setSeller(null)}
        confirmLoading={saving}
        okText='Guardar'
        cancelText='Cancelar'
        destroyOnClose
      >
        {seller && (
          <>
            <div className={'title-space-field'}>Nombre</div>
            <Input value={seller.name} size={'large'} placeholder={'Nombre'} maxLength={100} onChange={e => setField('name')(e.target.value)} />
            <div className={'title-space-field margin-top-15'}>Email</div>
            <Input value={seller.email} size={'large'} type={'email'} placeholder={'Escribir email'} maxLength={100} onChange={e => setField('email')(e.target.value)} />
            <div className={'title-space-field margin-top-15'}>Telefono</div>
            <Input
              value={seller.phone}
              size={'large'}
              placeholder={'Escribir telefono'}
              onChange={e => setField('phone')(formatPhoneOnChange(seller.phone, e.target.value))}
            />
            <div className={'title-space-field margin-top-15'}>Porcentaje de comision (%)</div>
            <InputNumber value={seller.commission_percentage} size={'large'} min={0} max={100} precision={2} style={{ width: '100%' }} onChange={setField('commission_percentage')} />
          </>
        )}
      </Modal>
    </div>
  )
}

export default Sellers
