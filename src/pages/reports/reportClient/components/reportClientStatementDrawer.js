import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Drawer,
  Table,
  DatePicker,
  Spin,
  Row,
  Col,
  Divider,
  Button,
  Pagination,
  Radio,
  Tag as AntTag,
  Input,
  message,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import FileExcelOutlined from '@ant-design/icons/lib/icons/FileExcelOutlined'
import ReportsSrc from '../../reportsSrc'
import {
  numberFormat,
  formatFactDate,
  formatGuatemalaDate,
  getDateRangeFilter,
  showErrors,
} from '../../../../utils'

const { RangePicker } = DatePicker
const { Search } = Input

const VIEW_UNPAID = 'UNPAID'
const VIEW_PAID = 'PAID'
const VIEW_HISTORY = 'HISTORY'

const isInvoiceFactDateMovement = movementType =>
  movementType === 'INVOICE' || movementType === 'MANUAL_INVOICE'

const movementTypeLabels = {
  INVOICE: 'Factura',
  MANUAL_INVOICE: 'Factura manual',
  PAYMENT: 'Pago',
  CREDIT_NOTE: 'Nota credito',
  DEBIT_NOTE: 'Nota debito',
}

const defaultPagination = {
  current: 1,
  pageSize: 20,
  total: 0,
}

const drawerBodyStyle = {
  height: 'calc(100% - 55px)',
  padding: '16px 24px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const pageLayoutStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
}

const staticSectionStyle = { flexShrink: 0 }

const tableSectionStyle = {
  flex: 1,
  minHeight: 0,
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

function ReportClientStatementDrawer({ visible, client, onClose }) {
  const { getFormattedValue } = numberFormat()
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [viewMode, setViewMode] = useState(VIEW_UNPAID)
  const [period, setPeriod] = useState(null)
  const [documentNumberFilter, setDocumentNumberFilter] = useState('')
  const [documentNumberInput, setDocumentNumberInput] = useState('')
  const [pagination, setPagination] = useState(defaultPagination)
  const [invoices, setInvoices] = useState([])
  const [invoiceSummary, setInvoiceSummary] = useState({
    total_unpaid_amount: 0,
    total_paid_amount: 0,
  })
  const [statement, setStatement] = useState({
    opening_balance: 0,
    closing_balance: 0,
    items: [],
  })

  const formatAmount = amount =>
    `Q ${getFormattedValue(Number(amount || 0).toFixed(2))}`

  useEffect(() => {
    if (!visible || !client) return

    setPeriod(null)
    setDocumentNumberFilter('')
    setDocumentNumberInput('')
    setPagination(defaultPagination)
    setInvoiceSummary({ total_unpaid_amount: 0, total_paid_amount: 0 })
    setViewMode(client.has_debt ? VIEW_UNPAID : VIEW_PAID)
  }, [visible, client])

  useEffect(() => {
    if (!visible || !client) return

    let cancelled = false
    setLoading(true)

    const loadData = async () => {
      try {
        if (viewMode === VIEW_HISTORY) {
          const result = await ReportsSrc.getClientsAccountMovements({
            stakeholder_id: client.id,
            ...getDateRangeFilter(period),
            ...(documentNumberFilter
              ? { document_number: documentNumberFilter }
              : {}),
            $limit: pagination.pageSize,
            $offset: (pagination.current - 1) * pagination.pageSize,
          })
          if (cancelled) return
          setStatement({
            opening_balance: Number(result.opening_balance) || 0,
            closing_balance: Number(result.closing_balance) || 0,
            items: result.items || [],
          })
          setInvoices([])
          setInvoiceSummary({ total_unpaid_amount: 0, total_paid_amount: 0 })
          setPagination(prev => ({
            ...prev,
            total: result.pagination?.total || 0,
          }))
          return
        }

        const result = await ReportsSrc.getClientsAccountInvoices({
          stakeholder_id: client.id,
          payment_status: viewMode,
          ...(documentNumberFilter
            ? { document_number: documentNumberFilter }
            : {}),
          $limit: pagination.pageSize,
          $offset: (pagination.current - 1) * pagination.pageSize,
        })
        if (cancelled) return
        const items = result.items || []
        setInvoices(items)
        setInvoiceSummary({
          total_unpaid_amount: Number(result.summary?.total_unpaid_amount) || 0,
          total_paid_amount: Number(result.summary?.total_paid_amount) || 0,
        })
        setStatement({
          opening_balance: 0,
          closing_balance: client.balance || 0,
          items: [],
        })
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0,
        }))
      } catch (error) {
        if (!cancelled) {
          setInvoices([])
          setInvoiceSummary({ total_unpaid_amount: 0, total_paid_amount: 0 })
          setStatement({ opening_balance: 0, closing_balance: 0, items: [] })
          setPagination(prev => ({ ...prev, total: 0 }))
          showErrors(error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [
    visible,
    client,
    viewMode,
    period,
    documentNumberFilter,
    pagination.current,
    pagination.pageSize,
  ])

  useLayoutEffect(() => {
    if (!visible) return undefined

    const updateTableHeight = () => {
      if (!tableSectionRef.current || !tableWrapperRef.current) return

      const wrapperHeight = tableWrapperRef.current.clientHeight
      const tableHead =
        tableSectionRef.current.querySelector('.ant-table-thead') ||
        tableSectionRef.current.querySelector('.ant-table-header')
      const headHeight = tableHead?.getBoundingClientRect().height || 0
      const scrollHeight = wrapperHeight - headHeight - 4

      setTableScrollY(Math.max(scrollHeight, 120))
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
    visible,
    loading,
    viewMode,
    statement.items?.length,
    invoices?.length,
    pagination.pageSize,
    pagination.current,
  ])

  const handleViewModeChange = event => {
    setViewMode(event.target.value)
    setPagination(defaultPagination)
  }

  const handlePeriodChange = value => {
    setPeriod(value || null)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleClearPeriod = () => {
    setPeriod(null)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleDocumentNumberSearch = value => {
    setDocumentNumberFilter(String(value || '').trim())
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleExportExcel = () => {
    if (!client?.id) return

    setExporting(true)

    const params = {
      stakeholder_id: client.id,
      view_mode: viewMode,
      reportType: 'clientAccountDetailReport',
      ...(documentNumberFilter ? { document_number: documentNumberFilter } : {}),
      ...(viewMode === VIEW_HISTORY ? getDateRangeFilter(period) : {}),
    }

    ReportsSrc.exportReport(params)
      .then(data => {
        message.success('Reporte creado')
        const uri = `data:application/octet-stream;base64,${data.reportExcel}`
        const link = document.createElement('a')
        const fileLabel =
          viewMode === VIEW_HISTORY
            ? 'historial'
            : viewMode === VIEW_PAID
            ? 'facturas-pagadas'
            : 'facturas-pendientes'
        link.setAttribute(
          'download',
          `Estado-Cuenta-${client.name || client.id}-${fileLabel}.xls`
        )
        link.setAttribute('href', uri)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(document.body.lastChild)
      })
      .catch(error => showErrors(error))
      .finally(() => setExporting(false))
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize,
    }))
  }

  const invoiceColumns = [
    {
      title: 'Factura / NS',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 140,
      render: (text, row) =>
        text ||
        (row.related_internal_document_id
          ? String(row.related_internal_document_id)
          : 'Factura del sistema'),
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
      align: 'right',
      render: text => formatAmount(text),
    },
    {
      title: 'Pagado',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      width: 110,
      align: 'right',
      render: text => formatAmount(text),
    },
    {
      title: 'Pendiente',
      dataIndex: 'unpaid_amount',
      key: 'unpaid_amount',
      width: 120,
      align: 'right',
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
      title: 'Estado',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 110,
      render: status =>
        status === 'PAID' ? (
          <AntTag color='green'>Pagada</AntTag>
        ) : (
          <AntTag color='red'>Pendiente</AntTag>
        ),
    },
  ]

  const historyColumns = [
    {
      title: 'Fecha',
      dataIndex: 'movement_date',
      key: 'movement_date',
      width: 110,
      render: (text, record) =>
        isInvoiceFactDateMovement(record.movement_type)
          ? formatFactDate(text) // documents.fact_date (ya Guatemala en BD)
          : formatGuatemalaDate(text), // payments.payment_date / notes.created_at (UTC)
    },
    {
      title: 'Tipo',
      dataIndex: 'movement_type',
      key: 'movement_type',
      width: 120,
      render: type => movementTypeLabels[type] || type,
    },
    {
      title: 'Documento / NS',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 140,
    },
    {
      title: 'Referencia',
      dataIndex: 'reference',
      key: 'reference',
      ellipsis: true,
    },
    {
      title: 'Cargo',
      dataIndex: 'charge_amount',
      key: 'charge_amount',
      width: 110,
      align: 'right',
      render: amount => (Number(amount) > 0 ? formatAmount(amount) : ''),
    },
    {
      title: 'Abono',
      dataIndex: 'credit_amount',
      key: 'credit_amount',
      width: 110,
      align: 'right',
      render: amount =>
        Number(amount) > 0 ? (
          <span style={{ color: '#389e0d' }}>{formatAmount(amount)}</span>
        ) : (
          ''
        ),
    },
    {
      title: 'Saldo',
      dataIndex: 'running_balance',
      key: 'running_balance',
      width: 120,
      align: 'right',
      render: amount => (
        <span style={{ fontWeight: 600 }}>{formatAmount(amount)}</span>
      ),
    },
  ]

  const unpaidTotal = invoiceSummary.total_unpaid_amount
  const paidTotal = invoiceSummary.total_paid_amount

  return (
    <Drawer
      title={client ? `Estado de cuenta - ${client.name}` : 'Estado de cuenta'}
      width='90%'
      visible={visible}
      onClose={onClose}
      destroyOnClose
      bodyStyle={drawerBodyStyle}
    >
      <div style={pageLayoutStyle}>
        <div style={staticSectionStyle}>
          <Radio.Group
            value={viewMode}
            onChange={handleViewModeChange}
            style={{ marginBottom: 12 }}
            buttonStyle='solid'
          >
            <Radio.Button value={VIEW_UNPAID}>Facturas pendientes</Radio.Button>
            <Radio.Button value={VIEW_PAID}>Facturas pagadas</Radio.Button>
            <Radio.Button value={VIEW_HISTORY}>Historial completo</Radio.Button>
          </Radio.Group>

          <Row gutter={16} style={{ marginBottom: 12 }} align='middle'>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                allowClear
                size='large'
                prefix={
                  <SearchOutlined className={'cabisa-table-search-icon'} />
                }
                placeholder='# Documento / NS'
                className={'cabisa-table-search customSearch'}
                value={documentNumberInput}
                onChange={event => setDocumentNumberInput(event.target.value)}
                onSearch={handleDocumentNumberSearch}
              />
            </Col>
            {viewMode === VIEW_HISTORY ? (
              <>
                <Col>
                  <span style={{ marginRight: 8, color: 'rgba(0,0,0,0.45)' }}>
                    Periodo (opcional)
                  </span>
                  <RangePicker
                    format='DD-MM-YYYY'
                    value={period}
                    onChange={handlePeriodChange}
                    allowClear
                    placeholder={['Desde', 'Hasta']}
                  />
                </Col>
                <Col>
                  <Button onClick={handleClearPeriod} disabled={!period}>
                    Ver historial completo
                  </Button>
                </Col>
              </>
            ) : null}
            <Col flex='auto' style={{ textAlign: 'right' }}>
              <Button
                type='primary'
                icon={<FileExcelOutlined />}
                loading={exporting}
                onClick={handleExportExcel}
              >
                Exportar a Excel
              </Button>
            </Col>
          </Row>

          <Row gutter={24} style={{ marginBottom: 8 }}>
            {viewMode === VIEW_UNPAID ? (
              <Col>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  Total pendiente (vista)
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {formatAmount(unpaidTotal)}
                </div>
              </Col>
            ) : null}
            {viewMode === VIEW_PAID ? (
              <Col>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  Total pagado (vista)
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {formatAmount(paidTotal)}
                </div>
              </Col>
            ) : null}
            {viewMode === VIEW_HISTORY ? (
              <>
                <Col>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    Saldo pendiente
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatAmount(client?.balance)}
                  </div>
                </Col>
                <Col>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    Total pagado
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatAmount(client?.total_paid)}
                  </div>
                </Col>
                <Col>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    Saldo inicial
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatAmount(statement.opening_balance)}
                  </div>
                </Col>
                <Col>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    Saldo final
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatAmount(statement.closing_balance)}
                  </div>
                </Col>
              </>
            ) : null}
            <Col>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                Ultimo pago
              </div>
              <div style={{ fontSize: 14 }}>
                {client?.last_payment_date
                  ? `${formatGuatemalaDate(client.last_payment_date)}${
                      client.last_payment_document
                        ? ` | Factura # ${client.last_payment_document}`
                        : ''
                    }`
                  : '-'}
              </div>
            </Col>
            <Col>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>NIT</div>
              <div style={{ fontSize: 14 }}>{client?.nit || '-'}</div>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
        </div>

        <div ref={tableSectionRef} style={tableSectionStyle}>
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin />
            </div>
          ) : (
            <>
              <div ref={tableWrapperRef} style={tableWrapperStyle}>
                {viewMode === VIEW_HISTORY ? (
                  <Table
                    size='small'
                    className={'CustomTableClass'}
                    rowKey={(row, index) =>
                      `${row.movement_type}-${row.document_number}-${row.movement_date}-${index}`
                    }
                    columns={historyColumns}
                    dataSource={statement.items}
                    pagination={false}
                    scroll={{ y: tableScrollY }}
                    locale={{ emptyText: 'Sin movimientos registrados' }}
                  />
                ) : (
                  <Table
                    size='small'
                    className={'CustomTableClass'}
                    rowKey='id'
                    columns={invoiceColumns}
                    dataSource={invoices}
                    pagination={false}
                    scroll={{ y: tableScrollY }}
                    locale={{
                      emptyText:
                        viewMode === VIEW_UNPAID
                          ? 'Sin facturas pendientes'
                          : 'Sin facturas pagadas',
                    }}
                    expandable={{
                      expandedRowRender: invoice =>
                        invoice.payments?.length ? (
                          <div className={'text-left'}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                              Pagos de la factura {invoice.document_number}
                            </div>
                            {invoice.payments.map(payment => (
                              <div
                                key={payment.payment_id}
                                style={{ marginBottom: 4 }}
                              >
                                {formatGuatemalaDate(payment.payment_date)} ·{' '}
                                {formatAmount(payment.payment_amount)}
                                {payment.reference
                                  ? ` · ${payment.reference}`
                                  : ''}
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
              <Pagination
                style={tablePaginationStyle}
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                pageSizeOptions={['10', '20', '50', '100']}
                showTotal={total =>
                  viewMode === VIEW_HISTORY
                    ? `${total} movimientos`
                    : `${total} facturas`
                }
                onChange={handlePaginationChange}
                onShowSizeChange={handlePaginationChange}
              />
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}

export default ReportClientStatementDrawer
