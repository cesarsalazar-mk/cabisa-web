import React, { useState, useLayoutEffect, useRef, useEffect } from 'react'
import {
  Card,
  Col,
  Row,
  Select,
  Table,
  Tag as AntTag,
  Button,
  Pagination,
  Input,
  Spin,
  Tooltip,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import FileTextOutlined from '@ant-design/icons/lib/icons/FileTextOutlined'
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined'
import Tag from '../../../../components/Tag'
import ReportsSrc from '../../reportsSrc'
import {
  numberFormat,
  sortColumnString,
  canViewRestrictedReportCards,
  formatFactDate,
  formatGuatemalaDate,
  showErrors,
} from '../../../../utils'

const { Search } = Input
const { Option } = Select

const debtStatusOptions = [
  { value: '', label: 'Todo' },
  { value: 'UNPAID', label: 'Pendiente de pago' },
  { value: 'PAID', label: 'Ya pagado' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'WITH_DEBT_OVER_90', label: 'Vencido +90 dias' },
]

const accountStatusMeta = {
  AL_DIA: { label: 'Ya pagado', color: 'green' },
  POR_VENCER: { label: 'Pendiente', color: 'gold' },
  VENCIDO: { label: 'Vencido', color: 'orange' },
  VENCIDO_90: { label: 'Vencido +90', color: 'red' },
}

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

const agingColumnTitle = (label, tooltip) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {label}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined
        style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}
      />
    </Tooltip>
  </span>
)

function SummaryCard({ title, primary, secondary, tertiary, items }) {
  return (
    <Card
      className={'card-border-radius'}
      style={cardStyle}
      bodyStyle={cardBodyStyle}
    >
      <div style={cardTitleStyle}>{title}</div>
      {items?.length ? (
        items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            style={{ marginTop: index === 0 ? 0 : 8 }}
          >
            <div style={cardItemStyle}>
              {item.label}: {item.value}
            </div>
            {item.detail ? (
              <div style={cardDetailStyle}>{item.detail}</div>
            ) : null}
          </div>
        ))
      ) : (
        <>
          {primary && <div style={cardItemStyle}>{primary}</div>}
          {secondary && <div style={cardDetailStyle}>{secondary}</div>}
          {tertiary && <div style={cardDetailStyle}>{tertiary}</div>}
        </>
      )}
    </Card>
  )
}

function UnpaidInvoicesExpand({ record, formatAmount }) {
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    ReportsSrc.getClientsAccountInvoices({
      stakeholder_id: record.id,
      payment_status: 'UNPAID',
    })
      .then(result => {
        if (!cancelled) setInvoices(result.items || result || [])
      })
      .catch(error => {
        if (!cancelled) {
          setInvoices([])
          showErrors(error)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [record.id])

  const columns = [
    {
      title: 'Factura',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 130,
    },
    {
      title: 'Fecha',
      dataIndex: 'document_date',
      key: 'document_date',
      width: 110,
      render: text => formatFactDate(text),
    },
    {
      title: 'Vence',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
      render: text => formatGuatemalaDate(text),
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 110,
      render: text => formatAmount(text),
    },
    {
      title: 'Pagado',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      width: 110,
      render: text => formatAmount(text),
    },
    {
      title: 'Pendiente',
      dataIndex: 'unpaid_amount',
      key: 'unpaid_amount',
      width: 120,
      render: text => (
        <span style={{ fontWeight: 600 }}>{formatAmount(text)}</span>
      ),
    },
    {
      title: 'Ultimo pago',
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 120,
      render: text => (text ? formatGuatemalaDate(text) : '-'),
    },
    {
      title: 'Dias atraso',
      dataIndex: 'days_overdue',
      key: 'days_overdue',
      width: 110,
      render: days => {
        const value = Number(days) || 0
        // Unpaid invoices that are not past due are still pending ("Por vencer"),
        // not "Al dia" (which means fully paid / no debt).
        if (value <= 0) return <AntTag color='gold'>Por vencer</AntTag>
        return (
          <span
            style={{
              color: value > 90 ? '#cf1322' : '#d46b08',
              fontWeight: 600,
            }}
          >
            {value} dias
          </span>
        )
      },
    },
  ]

  return (
    <div className={'text-left'}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>
        Facturas pendientes de pago
      </div>
      {loading ? (
        <Spin size='small' />
      ) : (
        <Table
          size='small'
          pagination={false}
          rowKey='id'
          dataSource={invoices}
          columns={columns}
          locale={{ emptyText: 'Sin facturas pendientes' }}
          scroll={{ y: 220 }}
          expandable={{
            expandedRowRender: invoice =>
              invoice.payments?.length ? (
                <div>
                  {invoice.payments.map(payment => (
                    <div key={payment.payment_id} style={{ marginBottom: 4 }}>
                      Pago {formatGuatemalaDate(payment.payment_date)}:{' '}
                      {formatAmount(payment.payment_amount)}
                      {payment.reference ? ` (${payment.reference})` : ''}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                  Sin pagos asociados a esta factura
                </span>
              ),
          }}
        />
      )}
    </div>
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
      title: 'Estado',
      dataIndex: 'account_status',
      key: 'account_status',
      width: 120,
      fixed: 'left',
      render: status => {
        const meta = accountStatusMeta[status] || accountStatusMeta.AL_DIA
        return <AntTag color={meta.color}>{meta.label}</AntTag>
      },
    },
    {
      title: 'Cliente',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => sortColumnString(a, b, 'name'),
      sortOrder:
        sortedInfo && sortedInfo.columnKey === 'name' && sortedInfo.order,
      ellipsis: true,
      render: (text, record) => (
        <span>
          <div>{text}</div>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
            Cod. {record.id}
            {record.nit ? ` | NIT ${record.nit}` : ''}
          </div>
        </span>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'stakeholder_type',
      key: 'stakeholder_type',
      width: 130,
      render: text => <Tag type='stakeholderTypes' value={text} />,
    },
    {
      title: 'Saldo pendiente',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      render: (text, record) => (
        <span
          style={{
            fontWeight: 600,
            color: record.has_overdue ? '#cf1322' : 'inherit',
          }}
        >
          {formatAmount(text)}
        </span>
      ),
    },
    {
      title: 'Total pagado',
      dataIndex: 'total_paid',
      key: 'total_paid',
      width: 120,
      render: text => formatAmount(text),
    },
    {
      title: 'Dias atraso',
      dataIndex: 'max_days_overdue',
      key: 'max_days_overdue',
      width: 110,
      render: (days, record) => {
        if (!record.has_debt) return <span style={{ color: '#52c41a' }}>0</span>
        const value = Number(days) || 0
        if (value <= 0) return <span>Por vencer</span>
        return (
          <span
            style={{
              fontWeight: 600,
              color: value > 90 ? '#cf1322' : '#d46b08',
            }}
          >
            {value}
          </span>
        )
      },
    },
    {
      title: 'Ultimo movimiento',
      dataIndex: 'last_movement_date',
      key: 'last_movement_date',
      width: 140,
      render: text => (text ? formatGuatemalaDate(text) : '-'),
    },
    {
      title: 'Ultimo pago',
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 160,
      render: (text, record) =>
        text ? (
          <span>
            <div>{formatGuatemalaDate(text)}</div>
            {record.last_payment_document ? (
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                Factura {record.last_payment_document}
              </div>
            ) : null}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Prox. vencimiento',
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      width: 130,
      render: text => (text ? formatGuatemalaDate(text) : '-'),
    },
    {
      title: agingColumnTitle(
        '0-30',
        'Saldo pendiente con hasta 30 dias desde el vencimiento (incluye facturas aun no vencidas).'
      ),
      dataIndex: 'aging_0_30',
      key: 'aging_0_30',
      width: 110,
      render: text => formatAmount(text),
    },
    {
      title: agingColumnTitle(
        '31-60',
        'Saldo pendiente con 31 a 60 dias de atraso desde la fecha de vencimiento.'
      ),
      dataIndex: 'aging_31_60',
      key: 'aging_31_60',
      width: 110,
      render: text => formatAmount(text),
    },
    {
      title: agingColumnTitle(
        '61-90',
        'Saldo pendiente con 61 a 90 dias de atraso desde la fecha de vencimiento.'
      ),
      dataIndex: 'aging_61_90',
      key: 'aging_61_90',
      width: 110,
      render: text => formatAmount(text),
    },
    {
      title: agingColumnTitle(
        '+90',
        'Saldo pendiente con mas de 90 dias de atraso desde la fecha de vencimiento.'
      ),
      dataIndex: 'aging_over_90',
      key: 'aging_over_90',
      width: 110,
      render: text => (
        <span
          style={{
            fontWeight: Number(text) > 0 ? 600 : 400,
            color: Number(text) > 0 ? '#cf1322' : 'inherit',
          }}
        >
          {formatAmount(text)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Button
          type='link'
          size='small'
          icon={<FileTextOutlined />}
          onClick={e => {
            e.stopPropagation()
            props.onOpenStatement(record)
          }}
        >
          Ver detalle
        </Button>
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      {canViewRestrictedReportCards() && (
        <div style={staticSectionStyle}>
          <Row gutter={[16, 16]} align='stretch'>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Facturacion'
                items={[
                  {
                    label: 'Total facturado',
                    value: formatAmount(summary?.approved_invoices_amount),
                    detail: `Cantidad de facturas aprobadas: ${
                      summary?.approved_invoices_count || 0
                    }`,
                  },
                  {
                    label: 'Total anulado',
                    value: formatAmount(summary?.cancelled_invoices_amount),
                    detail: `Cantidad de facturas anuladas: ${
                      summary?.cancelled_invoices_count || 0
                    }`,
                  },
                ]}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Ya pagado'
                primary={`${summary?.clients_without_debt || 0} clientes`}
                secondary={`Total pagado: ${formatAmount(summary?.total_paid)}`}
                tertiary={`Facturas pagadas: ${
                  summary?.total_paid_invoices || 0
                }`}
              />
            </Col>
            <Col {...summaryCardCol} style={cardColStyle}>
              <SummaryCard
                title='Pendiente de pago'
                primary={`${summary?.clients_with_debt || 0} clientes`}
                secondary={`Por cobrar: ${formatAmount(
                  summary?.total_debt_balance
                )}`}
                tertiary={`Facturas pendientes: ${
                  summary?.total_unpaid_invoices || 0
                }`}
              />
            </Col>
          </Row>
        </div>
      )}

      <div style={staticSectionStyle}>
        <Row gutter={16} style={{ marginTop: 15 }}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Search
              key={`name-search-${props.filtersResetKey}`}
              size={'large'}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder={'Buscar cliente'}
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
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
          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              className={'single-select'}
              placeholder={'Estado'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              value={props.filters?.debt_status ?? ''}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('debt_status')}
            >
              {debtStatusOptions.map(option => (
                <Option key={option.value || 'all'} value={option.value}>
                  {option.label}
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
              scroll={{ x: 1800, y: tableScrollY }}
              className={'CustomTableClass'}
              dataSource={props.dataSource}
              columns={columns}
              pagination={false}
              loading={props.loading}
              rowKey='id'
              onChange={(_pagination, _filters, sorter) =>
                setSortedInfo(sorter)
              }
              expandable={{
                expandedRowRender: record => (
                  <UnpaidInvoicesExpand
                    record={record}
                    formatAmount={formatAmount}
                  />
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
