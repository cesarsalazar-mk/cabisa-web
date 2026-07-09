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
  Button,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import ActionOptions from '../../../../components/actionOptions'
import Tag from '../../../../components/Tag'
import { permissions } from '../../../../commons/types'
import { numberFormat, canViewRestrictedReportCards } from '../../../../utils'
import ReportInventoryDetailDrawer from './reportInventoryDetailDrawer'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { getFormattedValue } = numberFormat()

const summaryCardCol = { xs: 24, sm: 12, md: 12, lg: 12 }

const cardTitleStyle = {
  fontSize: 12,
  color: 'rgba(0, 0, 0, 0.45)',
  marginBottom: 4,
}
const cardItemStyle = { fontSize: 20, fontWeight: 600, lineHeight: 1.4 }
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

const formatAmount = amount =>
  `Q ${getFormattedValue(Number(amount || 0).toFixed(2))}`

function SummaryCard({ title, value }) {
  return (
    <Card
      className={'card-border-radius'}
      style={cardStyle}
      bodyStyle={cardBodyStyle}
    >
      <div style={cardTitleStyle}>{title}</div>
      <div style={cardItemStyle}>{value}</div>
    </Card>
  )
}

const getColumns = ({ handlerEditRow }) => [
  {
    title: 'Codigo',
    dataIndex: 'code',
    key: 'code',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Nombre',
    dataIndex: 'description',
    key: 'description',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Costo Unitario Promedio',
    dataIndex: 'inventory_unit_value',
    key: 'inventory_unit_value',
    render: text => <span>{Number(text).toFixed(2)}</span>,
  },
  {
    title: 'Existencias',
    dataIndex: 'stock',
    key: 'stock',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Valor total',
    dataIndex: 'inventory_total_value',
    key: 'inventory_total_value',
    render: text => <span>{Number(text).toFixed(2)}</span>,
  },
  {
    title: 'Categoria',
    dataIndex: 'product_category',
    key: 'product_category',
    render: text => <Tag type='productCategories' value={text} />,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: text => <Tag type='productStatus' value={text} />,
  },
  {
    title: '',
    dataIndex: 'product_id',
    key: 'product_id',
    render: (_, data) => (
      <ActionOptions
        editPermissions={false}
        data={data}
        permissionId={permissions.REPORTES}
        handlerEditRow={handlerEditRow}
        editAction='show'
      />
    ),
  },
]

function ReportInventoryTable(props) {
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const [detailData, setDetailData] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)

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
  ])

  const handlerEditRow = data => {
    setShowDrawer(true)
    setDetailData(data.inventory_movements)
    setSelectedProductId(data.product_id)
  }

  const handleExportDetail = () => {
    if (!selectedProductId) return
    props.exportDataDetailToFile([{ product_id: selectedProductId }])
  }

  const columns = getColumns({ handlerEditRow })
  const { summary } = props

  return (
    <div style={pageLayoutStyle}>
      {canViewRestrictedReportCards() && (
        <div style={staticSectionStyle}>
          <Row gutter={[16, 16]} align='stretch'>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Total articulos del Inventario'
                value={summary?.total_items ?? 0}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Valor total de Inventario'
                value={formatAmount(summary?.total_value)}
              />
            </Col>
          </Row>
        </div>
      )}

      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`code-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por codigo de producto'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('code')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`description-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por nombre de producto'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('description')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <RangePicker
              key={`dateRange-${props.filtersResetKey}`}
              style={{ width: '100%', height: '40px', borderRadius: '6px' }}
              format='DD-MM-YYYY'
              value={props.filters?.dateRange}
              onChange={props.handleFiltersChange('dateRange')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Select
              key={`category-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Categoria de producto'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('product_category')}
              value={props.filters?.product_category ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.productCategoriesList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='productCategories' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3} lg={3}>
            <Button
              type='default'
              className='cabisa-clear-filters-button'
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '8px',
                border: '1px dashed var(--cabisa-light-blue, #177fce)',
                background: '#e6f7ff',
                color: 'var(--cabisa-light-blue, #177fce)',
                fontWeight: 500,
              }}
              onClick={props.onClearFilters}
              icon={<CloseSquareOutlined />}
            >
              Limpiar
            </Button>
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
              rowKey='product_id'
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

      <ReportInventoryDetailDrawer
        detailData={detailData}
        showDrawer={showDrawer}
        onClose={() => setShowDrawer(false)}
        exportDataDetailToFile={handleExportDetail}
      />
    </div>
  )
}

export default ReportInventoryTable
