import React from 'react'
import { Row, Col, Table, Card, Drawer, Button } from 'antd'
import Tag from '../../../../components/Tag'
import { numberFormat, formatGuatemalaDate } from '../../../../utils'

const { getFormattedValue } = numberFormat()

const columns = [
  {
    title: 'Fecha',
    dataIndex: 'created_at', // Field that is goint to be rendered
    key: 'created_at',
    render: text =>
      text ? <span>{formatGuatemalaDate(text, 'DD-MM-YYYY hh:mm:ss A')}</span> : null,
  },
  {
    title: 'Tipo',
    dataIndex: 'operation_type', // Field that is goint to be rendered
    key: 'operation_type',
    render: text => <Tag type='operationsTypes' value={text} />,
  },
  {
    title: 'Operacion',
    dataIndex: 'movement_type', // Field that is goint to be rendered
    key: 'movement_type',
    render: text => <Tag type='inventoryMovementsTypes' value={text} />,
  },
  {
    title: 'Autorizado por',
    dataIndex: 'creator_name', // Field that is goint to be rendered
    key: 'creator_name',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Cantidad',
    dataIndex: 'quantity', // Field that is goint to be rendered
    key: 'quantity',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Valor unitario del movimiento',
    dataIndex: 'unit_cost', // Field that is goint to be rendered
    key: 'unit_cost',
    render: text => <span>{getFormattedValue(text)}</span>,
  },
  {
    title: 'Valor total del movimiento',
    dataIndex: 'total_cost', // Field that is goint to be rendered
    key: 'total_cost',
    render: text => <span>{getFormattedValue(text)}</span>,
  },
  {
    title: 'Existencias Actuales',
    dataIndex: 'inventory_quantity', // Field that is goint to be rendered
    key: 'inventory_quantity',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Valor unitario Promedio',
    dataIndex: 'inventory_unit_cost', // Field that is goint to be rendered
    key: 'inventory_unit_cost',
    render: text => <span>{getFormattedValue(text)}</span>,
  },
  {
    title: 'Valor Total',
    dataIndex: 'inventory_total_cost', // Field that is goint to be rendered
    key: 'inventory_total_cost',
    render: text => <span>{getFormattedValue(text)}</span>,
  },
]


function ReportInventoryDetailDrawer(props) {
  return (
    <Drawer
      placement='right'
      closable={false}
      onClose={props.onClose}
      visible={props.showDrawer}
      width='80%'
      destroyOnClose
      footer={
        <Row gutter={16}>
          <Col xs={12} sm={12} md={12} lg={12}>
            <Button size='large' type='primary' onClick={props.onClose}>
              Volver
            </Button>
          </Col>
          <Col xs={12} sm={12} md={12} lg={12}>
            <Button size='large' type='primary' onClick={() => props.exportDataDetailToFile(props.detailData)}>
              Exportar
            </Button>
          </Col>
        </Row>
      }
    >
      <Card className={'card-border-radius margin-top-15'}>
        <Row>
          <Col xs={24} sm={24} md={24} lg={24}>
            <Row>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Table
                  dataSource={props.detailData}
                  columns={columns}
                  className={'CustomTableClass'}
                  pagination={false}
                  rowKey='inventory_movement_id'
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    </Drawer>
  )
}

export default ReportInventoryDetailDrawer
