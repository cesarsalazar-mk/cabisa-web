import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  DatePicker,
  Input,
  Pagination,
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

const staticSectionStyle = { flexShrink: 0 }

const pageLayoutStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
}

const tableSectionStyle = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  marginTop: 15,
  overflow: 'hidden',
}

const tableCardStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const tableCardBodyStyle = {
  flex: 1,
  minHeight: 0,
  padding: '12px 24px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const tableWrapperStyle = {
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}

const tablePaginationStyle = {
  flexShrink: 0,
  marginTop: 12,
  textAlign: 'right',
}

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
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)

  useLayoutEffect(() => {
    const updateTableHeight = () => {
      if (!tableSectionRef.current || !tableWrapperRef.current) return

      const wrapperHeight = tableWrapperRef.current.clientHeight
      const tableHead =
        tableSectionRef.current.querySelector('.ant-table-thead') ||
        tableSectionRef.current.querySelector('.ant-table-header')
      const headHeight = tableHead?.getBoundingClientRect().height || 0
      const scrollHeight = wrapperHeight - headHeight - 4

      setTableScrollY(Math.max(scrollHeight, 80))
    }

    const scheduleUpdate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateTableHeight)
      })
    }

    scheduleUpdate()
    window.addEventListener('resize', scheduleUpdate)

    let resizeObserver
    const sectionEl = tableSectionRef.current
    const wrapperEl = tableWrapperRef.current

    if (window.ResizeObserver && sectionEl) {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(sectionEl)
      if (wrapperEl) resizeObserver.observe(wrapperEl)
    }

    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      resizeObserver?.disconnect()
    }
  }, [
    props.loading,
    props.dataSource?.length,
    props.pagination?.pageSize,
    props.pagination?.current,
    props.summary,
    props.productTypeFilter,
  ])

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
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
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
      </div>

      <div style={staticSectionStyle}>
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
      </div>

      <div ref={tableSectionRef} style={tableSectionStyle}>
        <Card
          className={'card-border-radius'}
          style={tableCardStyle}
          bodyStyle={tableCardBodyStyle}
        >
          <div ref={tableWrapperRef} style={tableWrapperStyle}>
            <Table
              scroll={{ y: tableScrollY }}
              className={'CustomTableClass'}
              dataSource={props.dataSource}
              columns={columns}
              pagination={false}
              loading={props.loading}
              rowKey='id'
            />
          </div>
          <Pagination
            style={tablePaginationStyle}
            current={props.pagination?.current}
            pageSize={props.pagination?.pageSize}
            total={props.pagination?.total}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            onChange={props.onPaginationChange}
            onShowSizeChange={props.onPaginationChange}
          />
        </Card>
      </div>
    </div>
  )
}

export default ReportSalesProductTable
