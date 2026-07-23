import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  Collapse,
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
import Tag from '../../../../components/Tag'
import moment from 'moment'
import {
  numberFormat,
  canViewRestrictedReportCards,
  formatGuatemalaDate,
  parseGuatemalaDate,
} from '../../../../utils'
import ActionOptions from '../../../../components/actionOptions'
import DocumentTotalCell from '../../../../components/DocumentTotalCell'

const { Panel } = Collapse
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { getFormattedValue } = numberFormat()

const summaryCardCol = { xs: 24, sm: 12, md: 6, lg: 6 }

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

function DetailSummaryRow({ title, data }) {
  return (
    <Row gutter={16} style={{ marginTop: 12 }}>
      <Col xs={24} sm={12} md={6} lg={6}>
        <SummaryCard title={`${title} - Total facturado`} value={formatAmount(data?.billed)} />
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <SummaryCard title={`${title} - Total pagado`} value={formatAmount(data?.paid)} />
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <SummaryCard title={`${title} - Balance`} value={formatAmount(data?.balance)} />
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <SummaryCard title={`${title} - Cantidad`} value={data?.count ?? 0} />
      </Col>
    </Row>
  )
}

function ReportCashReceiptsTable(props) {
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
  ])

  const handlerEditRow = data => props.handlerEditRow(data)

  const columns = [
    {
      width: 120,
      title: '# Nota serv.',
      dataIndex: 'related_internal_document_id',
      key: 'related_internal_document_id',
      render: text => <span>{text}</span>,
    },
    {
      width: 125,
      title: '# Documento',
      dataIndex: 'document_number',
      key: 'document_number',
      render: text =>
        text ? <span>{text}</span> : <span>Factura del sistema</span>,
    },
    {
      width: 115,
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: text => (
        <span>{formatGuatemalaDate(text)}</span>
      ),
    },
    {
      width: 115,
      title: 'Dias de credito',
      dataIndex: 'credit_days_display',
      key: 'credit_days_display',
      render: (_, record) => (
        <span>
          {record.created_at
            ? moment().startOf('day').diff(parseGuatemalaDate(record.created_at).startOf('day'), 'days')
            : ''}
        </span>
      ),
    },
    {
      width: 300,
      title: 'Cliente',
      dataIndex: 'client',
      key: 'client',
      render: (_, record) => (
        <>
          <span>{record.stakeholder_name}</span>
          <br />
          <span>Nit: {record.stakeholder_nit}</span>
        </>
      ),
    },
    {
      width: 120,
      title: 'Monto pendiente',
      key: 'pending_amount',
      align: 'center',
      render: (_, record) => (
        <span>
          {`Q ${getFormattedValue(
            (
              Number(record.adjusted_total ?? record.total_amount ?? 0) -
              Number(record.due || 0)
            ).toFixed(2)
          )}`}
        </span>
      ),
    },
    {
      width: 160,
      title: 'Monto Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'center',
      render: (_, record) => (
        <DocumentTotalCell
          record={record}
          totalField='total_amount'
          showCurrencyPrefix
        />
      ),
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
          permissionId={10}
          handlerEditRow={handlerEditRow}
          editAction='show'
        />
      ),
    },
  ]

  const { summary } = props

  return (
    <div style={pageLayoutStyle}>
      {canViewRestrictedReportCards() && (
        <div style={staticSectionStyle}>
          <Row gutter={[16, 16]} align='stretch'>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Total facturado'
                value={formatAmount(summary?.total_billed)}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Total pagado'
                value={formatAmount(summary?.total_paid)}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Balance'
                value={formatAmount(summary?.total_balance)}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Cantidad de facturas'
                value={summary?.total_invoices ?? 0}
              />
            </Col>
          </Row>

          <Collapse style={{ marginTop: 15 }}>
            <Panel header='Detalle facturacion electronica' key='electronic'>
              <DetailSummaryRow title='Electronica' data={summary?.electronic} />
            </Panel>
            <Panel header='Detalle facturacion del sistema' key='system'>
              <DetailSummaryRow title='Sistema' data={summary?.system} />
            </Panel>
          </Collapse>
        </div>
      )}

      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`service-note-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='# Nota serv.'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('related_internal_document_id')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`document-number-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='# Documento'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('document_number')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`client-name-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Nombre Cliente'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <RangePicker
              key={`created-at-${props.filtersResetKey}`}
              style={{ width: '100%', height: '40px', borderRadius: '6px' }}
              format='DD-MM-YYYY'
              value={props.filters?.created_at}
              onChange={props.handleFiltersChange('created_at')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
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
        <Row gutter={16} style={{ marginTop: 15 }}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              key={`payment-method-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Metodo de pago'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('paymentMethods')}
              value={props.filters?.paymentMethods ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.paymentMethodsOptionsList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='documentsPaymentMethods' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              key={`credit-status-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Estado de Credito'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('creditStatus')}
              value={props.filters?.creditStatus ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.creditStatusOptionsList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='creditStatus' value={value} />
                </Option>
              ))}
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

export default ReportCashReceiptsTable
