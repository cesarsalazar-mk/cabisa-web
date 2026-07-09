import React, { useState, useLayoutEffect, useRef } from 'react'
import moment from 'moment'
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Table,
  Tag as AntTag,
  Button,
  Pagination,
  Input,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import Tag from '../../../../components/Tag'
import {
  numberFormat,
  formatPhone,
  sortColumnString,
  canViewRestrictedReportCards,
} from '../../../../utils'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const debtStatusOptions = [
  { value: '', label: 'Todo' },
  { value: 'WITH_DEBT', label: 'Con deuda' },
  { value: 'WITHOUT_DEBT', label: 'Sin deuda' },
]

const summaryCardCol = { xs: 24, sm: 12, md: 8, lg: 8 }

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

function SummaryCard({ title, primary, secondary, tertiary }) {
  return (
    <Card
      className={'card-border-radius'}
      style={cardStyle}
      bodyStyle={cardBodyStyle}
    >
      <div style={cardTitleStyle}>{title}</div>
      {primary && <div style={cardItemStyle}>{primary}</div>}
      {secondary && <div style={cardDetailStyle}>{secondary}</div>}
      {tertiary && <div style={cardDetailStyle}>{tertiary}</div>}
    </Card>
  )
}

function ReportClientTable(props) {
  const [sortedInfo, setSortedInfo] = useState(null)
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const { getFormattedValue } = numberFormat()
  const { summary } = props

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
    props.filters?.debt_status,
  ])

  const formatAmount = amount =>
    `Q ${getFormattedValue(Number(amount || 0).toFixed(2))}`

  const columns = [
    {
      title: 'Estado cuenta',
      dataIndex: 'has_debt',
      key: 'has_debt',
      width: 120,
      render: hasDebt =>
        hasDebt ? (
          <AntTag color='red'>Con deuda</AntTag>
        ) : (
          <AntTag color='green'>Al dia</AntTag>
        ),
    },
    {
      title: 'Codigo cliente',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: text => <span>{text}</span>,
    },
    {
      title: 'Nombre o Razon social',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => sortColumnString(a, b, 'name'),
      sortOrder:
        sortedInfo && sortedInfo.columnKey === 'name' && sortedInfo.order,
      ellipsis: true,
      render: text => <span>{text}</span>,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: text => <span>{moment(text).format('DD-MM-YYYY')}</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'stakeholder_type',
      key: 'stakeholder_type',
      width: 140,
      render: text => <Tag type='stakeholderTypes' value={text} />,
    },
    {
      title: 'Cargos',
      dataIndex: 'total_credit',
      key: 'total_credit',
      width: 120,
      render: text => <span>{formatAmount(text)}</span>,
    },
    {
      title: 'Pagado',
      dataIndex: 'paid_credit',
      key: 'paid_credit',
      width: 120,
      render: text => <span>{formatAmount(text)}</span>,
    },
    {
      title: 'Balance',
      key: 'credit_balance',
      width: 120,
      render: (_, record) => (
        <span
          style={{
            fontWeight: record.has_debt ? 600 : 400,
            color: record.has_debt ? '#cf1322' : 'inherit',
          }}
        >
          {formatAmount(record.credit_balance)}
        </span>
      ),
    },
  ]

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter)
  }

  return (
    <div style={pageLayoutStyle}>
      {canViewRestrictedReportCards() && (
        <div style={staticSectionStyle}>
          <Row gutter={[16, 16]} align='stretch'>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Clientes con deuda'
                primary={`${summary?.clients_with_debt || 0} clientes`}
                secondary={`Facturado: ${formatAmount(
                  summary?.total_debt_charge
                )}`}
                tertiary={`Pagado: ${formatAmount(
                  summary?.total_debt_paid
                )} | Saldo: ${formatAmount(summary?.total_debt_balance)}`}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Clientes sin deuda'
                primary={`${summary?.clients_without_debt || 0} clientes`}
                secondary={`Facturado: ${formatAmount(
                  summary?.total_without_debt_charge
                )}`}
                tertiary={`Pagado: ${formatAmount(
                  summary?.total_without_debt_paid
                )}`}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Total cargos'
                primary={formatAmount(summary?.total_credit)}
                secondary={`${
                  summary?.total_clients || 0
                } clientes en el reporte`}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Total pagado'
                primary={formatAmount(summary?.total_paid_credit)}
                secondary={`Con deuda: ${formatAmount(
                  summary?.total_debt_paid
                )} + Sin deuda: ${formatAmount(
                  summary?.total_without_debt_paid
                )}`}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Balance total'
                primary={formatAmount(summary?.total_credit_balance)}
              />
            </Col>
          </Row>
        </div>
      )}

      <div style={staticSectionStyle}>
        <Row gutter={16} style={{ marginTop: 15 }}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <RangePicker
              key={`created-at-${props.filtersResetKey}`}
              allowClear
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
              placeholder={['Fecha inicio', 'Fecha fin']}
              format='DD-MM-YYYY'
              value={props.filters?.created_at}
              onChange={props.handleFiltersChange('created_at')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`name-search-${props.filtersResetKey}`}
              size={'large'}
              type='tel'
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder={'Buscar por nombre'}
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Select
              key={`stakeholder-type-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Tipo de cliente'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              value={props.filters?.stakeholder_type ?? ''}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('stakeholder_type')}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.stakeholderTypesOptionsList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='stakeholderTypes' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Select
              className={'single-select'}
              placeholder={'Estado de cuenta'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              value={props.filters?.debt_status ?? ''}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('debt_status')}
            >
              {debtStatusOptions.map(option => (
                <Option key={option.value || 'all'} value={option.value}>
                  {option.value === '' ? (
                    <AntTag color='gray'>{option.label}</AntTag>
                  ) : option.value === 'WITH_DEBT' ? (
                    <AntTag color='red'>{option.label}</AntTag>
                  ) : (
                    <AntTag color='green'>{option.label}</AntTag>
                  )}
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
              rowKey='id'
              onChange={handleChange}
              onRow={record => ({
                style: {
                  backgroundColor: record.has_debt ? '#fff1f0' : '#f6ffed',
                },
              })}
              expandable={{
                expandedRowRender: record => (
                  <div className={'text-left'}>
                    <p>
                      <b>Direccion: </b>{' '}
                      {record.address !== null ? record.address : ''}{' '}
                    </p>
                    <p>
                      <b>Email: </b> {record.email !== null ? record.email : ''}{' '}
                    </p>
                    <p>
                      <b>Telefono: </b>{' '}
                      {record.phone ? formatPhone(record.phone) : ''}{' '}
                    </p>
                    <p>
                      <b>Encargado compras: </b>{' '}
                      {record.business_man ? record.business_man : ''}{' '}
                    </p>
                    <p>
                      <b>Encargado pagos: </b>{' '}
                      {record.payments_man ? record.payments_man : ''}{' '}
                    </p>
                  </div>
                ),
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <DownOutlined onClick={e => onExpand(record, e)} />
                  ) : (
                    <RightOutlined onClick={e => onExpand(record, e)} />
                  ),
              }}
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

export default ReportClientTable
