import React from 'react'
import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Tag as AntTag,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import { numberFormat } from '../../../../utils'
import { productsTypes } from '../../../../commons/types'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { getFormattedValue } = numberFormat()

const productTypeLabels = {
  [productsTypes.PRODUCT]: 'Producto',
  [productsTypes.SERVICE]: 'Servicio',
}

const cardTitleStyle = {
  fontSize: 12,
  color: 'rgba(0, 0, 0, 0.45)',
  marginBottom: 4,
}
const cardItemStyle = { fontSize: 13, fontWeight: 500, lineHeight: 1.4 }
const cardDetailStyle = {
  fontSize: 12,
  marginTop: 6,
  color: 'rgba(0, 0, 0, 0.65)',
}
const cardBodyStyle = {
  padding: '12px 16px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const cardStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}

const formatAmount = amount =>
  `Q ${getFormattedValue(Number(amount || 0).toFixed(2))}`

const formatTopItemLabel = item =>
  item ? `${item.code} - ${item.description}` : 'Sin datos'

const cardColStyle = { display: 'flex' }

function SummaryCard({ title, label, quantity, amount }) {
  return (
    <Card
      className={'card-border-radius'}
      style={cardStyle}
      bodyStyle={cardBodyStyle}
    >
      <div style={cardTitleStyle}>{title}</div>
      {label && <div style={cardItemStyle}>{label}</div>}
      {(quantity !== undefined || amount !== undefined) && (
        <div style={{ ...cardDetailStyle, marginTop: label ? 6 : 4 }}>
          {quantity !== undefined && <span>{quantity} uds</span>}
          {quantity !== undefined && amount !== undefined && (
            <span style={{ margin: '0 8px' }}>|</span>
          )}
          {amount !== undefined && <span>{formatAmount(amount)}</span>}
        </div>
      )}
    </Card>
  )
}

function ReportSalesProductTable(props) {
  const itemLabel =
    props.productTypeFilter === productsTypes.SERVICE
      ? 'servicio'
      : props.productTypeFilter === productsTypes.PRODUCT
      ? 'producto'
      : ''

  const itemsLabel =
    props.productTypeFilter === productsTypes.SERVICE
      ? 'servicios'
      : props.productTypeFilter === productsTypes.PRODUCT
      ? 'productos'
      : 'productos/servicios'

  const columns = [
    ...(!props.productTypeFilter
      ? [
          {
            title: 'Tipo',
            dataIndex: 'product_type',
            key: 'product_type',
            render: text => (
              <AntTag
                color={text === productsTypes.SERVICE ? '#187fce' : '#87d067'}
              >
                {productTypeLabels[text] || text}
              </AntTag>
            ),
          },
        ]
      : []),
    {
      title: `Codigo de ${itemsLabel}`,
      dataIndex: 'code',
      key: 'code',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Nombre / Descripcion',
      dataIndex: 'description',
      key: 'description',
      render: text => <span>{text}</span>,
    },
    {
      title: `Cantidad de ${itemsLabel} vendidos`,
      dataIndex: 'product_quantity',
      key: 'product_quantity',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Total vendido',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: text => (
        <span>{`Q ${getFormattedValue(Number(text).toFixed(2))}`}</span>
      ),
    },
  ]

  const { summary } = props
  const topProduct = summary?.top_product
  const topService = summary?.top_service

  return (
    <>
      <Row gutter={[16, 16]} align='stretch'>
        <Col xs={24} sm={12} md={6} lg={6} style={cardColStyle}>
          <SummaryCard
            title='Producto mas vendido'
            label={formatTopItemLabel(topProduct)}
            quantity={topProduct?.product_quantity}
            amount={topProduct?.total_amount}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} style={cardColStyle}>
          <SummaryCard
            title='Servicio mas vendido'
            label={formatTopItemLabel(topService)}
            quantity={topService?.product_quantity}
            amount={topService?.total_amount}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} style={cardColStyle}>
          <SummaryCard
            title='Total vendido en productos'
            quantity={summary?.products_total_quantity}
            amount={summary?.products_total_amount}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} style={cardColStyle}>
          <SummaryCard
            title='Total vendido en servicios'
            quantity={summary?.services_total_quantity}
            amount={summary?.services_total_amount}
          />
        </Col>
      </Row>

      <Row gutter={16} className={'margin-top-15'}>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Search
            prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
            placeholder={`Codigo ${itemLabel || ''}`}
            className={'cabisa-table-search customSearch'}
            size={'large'}
            onSearch={props.handleFiltersChange('code')}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Search
            prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
            placeholder='Nombre / Descripcion'
            className={'cabisa-table-search customSearch'}
            size={'large'}
            onSearch={props.handleFiltersChange('description')}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <RangePicker
            style={{ width: '100%', height: '40px', borderRadius: '6px' }}
            format='DD-MM-YYYY'
            onChange={props.handleFiltersChange('created_at')}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            className={'single-select'}
            placeholder={'Tipo de item'}
            size={'large'}
            style={{ width: '100%', height: '40px' }}
            getPopupContainer={trigger => trigger.parentNode}
            onChange={props.handleFiltersChange('product_type')}
            defaultValue=''
          >
            <Option value={''}>
              <AntTag color='gray'>Todos</AntTag>
            </Option>
            <Option value={productsTypes.PRODUCT}>
              <AntTag color='#87d067'>Producto</AntTag>
            </Option>
            <Option value={productsTypes.SERVICE}>
              <AntTag color='#187fce'>Servicio</AntTag>
            </Option>
          </Select>
        </Col>
      </Row>

      <Row>
        <Col xs={24} sm={24} md={24} lg={24}>
          <Card className={'card-border-radius margin-top-15'}>
            <Row>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Table
                  scroll={{ y: 820 }}
                  className={'CustomTableClass'}
                  dataSource={props.dataSource}
                  columns={columns}
                  pagination={{
                    current: props.pagination?.current,
                    pageSize: props.pagination?.pageSize,
                    total: props.pagination?.total,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    onChange: props.onPaginationChange,
                    onShowSizeChange: props.onPaginationChange,
                  }}
                  loading={props.loading}
                  rowKey='id'
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ReportSalesProductTable
