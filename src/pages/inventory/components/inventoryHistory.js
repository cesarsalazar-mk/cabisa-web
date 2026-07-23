import React from 'react'
import { Row, Col, Divider, Input } from 'antd'
import DynamicTable from '../../../components/DynamicTable'
import Tag from '../../../components/Tag'
import { formatGuatemalaDate } from '../../../utils'

function InventoryHistory(props) {
  const columnsHistory = [
    {
      width: 180,
      title: 'Fecha',
      dataIndex: 'created_at', // Field that is goint to be rendered
      key: 'created_at',
      render: text => (
        <div>{formatGuatemalaDate(text) || null}</div>
      ),
    },
    {
      title: 'Tipo de Operacion',
      dataIndex: 'operation_type', // Field that is goint to be rendered
      key: 'operation_type',
      render: text => (
        <Tag
          type='operationsTypes'
          value={text}
          size={'large'}
          placeholder={'Tipo de Operacion'}
        />
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity', // Field that is goint to be rendered
      key: 'quantity',
      render: text => <div>{text}</div>,
    },
    {
      title: 'Tipo de Movimiento',
      dataIndex: 'movement_type', // Field that is goint to be rendered
      key: 'movement_type',
      render: text => (
        <Tag
          type='inventoryMovementsTypes'
          value={text}
          size={'large'}
          placeholder={'Tipo de Movimiento'}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status', // Field that is goint to be rendered
      key: 'status',
      render: text => (
        <Tag
          type='inventoryMovementsStatus'
          value={text}
          size={'large'}
          placeholder={'Status'}
        />
      ),
    },
  ]

  return (
    <>
      <Divider className={'divider-custom-margins-users'} />
      <Row
        gutter={16}
        className={'section-space-list'}
        justify='space-between'
        align='middle'
      >
        <Col xs={12} sm={12} md={12} lg={18}>
          <h1>Bitacora</h1>
        </Col>
        <Col
          xs={12}
          sm={12}
          md={12}
          lg={6}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            style={{
              marginRight: '15px',
              marginTop: '10px',
              minWidth: '120px',
            }}
            className={'title-space-field'}
          >
            <b>Existencia:</b>
          </div>
          <Input
            type='tel'
            placeholder={'Existencia'}
            size={'large'}
            style={{ height: '40px', width: '75%', minWidth: '100px' }}
            value={props.dataDetail?.stock || 0}
            disabled
          />
        </Col>
      </Row>

      <Divider className={'divider-custom-margins-users'} />

      <Row gutter={16} className={'section-space-field'}>
        <Col xs={24} sm={24} md={24} lg={24}>
          <DynamicTable
            columns={columnsHistory}
            data={props.dataDetail?.product_history}
          />
        </Col>
      </Row>
    </>
  )
}
export default InventoryHistory
