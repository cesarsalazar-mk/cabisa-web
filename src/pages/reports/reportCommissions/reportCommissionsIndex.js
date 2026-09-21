import React, { useCallback, useEffect, useState } from 'react'
import debounce from 'lodash/debounce'
import { Button, Card, Col, DatePicker, message, Pagination, Popconfirm, Row, Select, Switch, Table, Tabs, Tag, Tooltip } from 'antd'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import DownloadOutlined from '@ant-design/icons/lib/icons/DownloadOutlined'
import HeaderPage from '../../../components/HeaderPage'
import SellerSelect from '../../billing/components/SellerSelect'
import CollapsibleCards from '../../../components/CollapsibleCards'
import ReportsSrc from '../reportsSrc'
import { appConfig, stakeholdersStatus, stakeholdersTypes } from '../../../commons/types'
import { formatFactDate, getDateRangeFilter, numberFormat, showErrors } from '../../../utils'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs
const { getFormattedValue } = numberFormat()

const formatAmount = amount => `Q ${getFormattedValue(Number(amount || 0).toFixed(2))}`

const emptyTotals = { invoices_count: 0, total_amount: 0, base_amount: 0, commission_amount: 0 }
const emptySummary = { to_pay: emptyTotals, commission_paid: emptyTotals, cancelled_paid: emptyTotals, unpaid: emptyTotals, by_seller: [] }
const initFilters = { dateRange: null, stakeholder_id: undefined, seller_id: undefined, payment_status: 'ALL', commission_status: 'ALL', exclude_iva: true }

function SummaryCard({ title, totals, color }) {
  return (
    <Card className={'card-border-radius'} bodyStyle={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color }}>{formatAmount(totals.commission_amount)}</div>
      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
        {totals.invoices_count} facturas · Base {formatAmount(totals.base_amount)}
      </div>
    </Card>
  )
}

function ReportCommissions() {
  const [filters, setFilters] = useState(initFilters)
  const [resetKey, setResetKey] = useState(0)
  const [clientsOptions, setClientsOptions] = useState([])
  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sellers')
  const [selectedKeys, setSelectedKeys] = useState([])
  const [reloadKey, setReloadKey] = useState(0)

  const setFilter = field => value => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const searchClients = useCallback(
    debounce((text = '') => {
      ReportsSrc.getStakeholdersOptions({
        name: { $like: `%25${text}%25` },
        status: stakeholdersStatus.ACTIVE,
        stakeholder_type: { $ne: stakeholdersTypes.PROVIDER },
        $limit: appConfig.selectsInitLimit,
      })
        .then(setClientsOptions)
        .catch(() => message.error('Error al cargar clientes'))
    }, 400),
    []
  )

  useEffect(() => {
    searchClients()
  }, [searchClients])

  const getFilterParams = () => ({
    stakeholder_id: filters.stakeholder_id,
    seller_id: filters.seller_id,
    payment_status: filters.payment_status,
    commission_status: filters.commission_status,
    exclude_iva: filters.exclude_iva ? '1' : '0', // '0' como string: api.js descarta valores falsy
    ...getDateRangeFilter(filters.dateRange),
  })

  const exportExcel = (reportType, fileName) => {
    setLoading(true)

    ReportsSrc.exportReport({ ...getFilterParams(), reportType })
      .then(data => {
        const link = document.createElement('a')
        link.setAttribute('download', fileName)
        link.setAttribute('href', `data:application/octet-stream;base64,${data.reportExcel}`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('Reporte creado')
      })
      .catch(() => message.error('Error al exportar el reporte'))
      .finally(() => setLoading(false))
  }

  const markCommissions = (ids, paid) => {
    setLoading(true)

    ReportsSrc.markCommissionsPaid({ document_ids: ids, paid, exclude_iva: filters.exclude_iva ? '1' : '0' })
      .then(() => {
        message.success(paid ? 'Comisiones marcadas como pagadas' : 'Comision desmarcada')
        setReloadKey(prev => prev + 1)
      })
      .catch(error => {
        showErrors(error)
        setLoading(false)
      })
  }

  const exportButton = (reportType, fileName) => (
    <Button className='title-cabisa new-button' icon={<DownloadOutlined />} onClick={() => exportExcel(reportType, fileName)}>
      Exportar Excel
    </Button>
  )

  useEffect(() => {
    setLoading(true)

    ReportsSrc.getCommissions({
      ...getFilterParams(),
      $limit: pagination.pageSize,
      $offset: (pagination.current - 1) * pagination.pageSize,
    })
      .then(result => {
        setDataSource(result.items)
        setSummary(result.summary)
        setPagination(prev => ({ ...prev, total: result.pagination.total }))
      })
      .catch(() => message.error('Error al cargar reporte de comisiones'))
      .finally(() => setLoading(false))
    setSelectedKeys([])
  }, [filters, pagination.current, pagination.pageSize, reloadKey])

  const clearFilters = () => {
    setFilters(initFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
    setResetKey(prev => prev + 1)
  }

  const amountColumn = (title, dataIndex) => ({
    title,
    dataIndex,
    key: dataIndex,
    align: 'right',
    render: value => formatAmount(value),
  })

  const invoiceColumns = [
    { title: '# Documento', dataIndex: 'document_number', key: 'document_number' },
    { title: 'Fecha', dataIndex: 'document_date', key: 'document_date', render: text => formatFactDate(text) },
    {
      title: 'Cliente',
      key: 'client',
      render: (_, record) => (
        <>
          {record.stakeholder_name}
          <br />
          Nit: {record.stakeholder_nit}
        </>
      ),
    },
    { title: 'Vendedor', dataIndex: 'seller_name', key: 'seller_name' },
    amountColumn('Total factura', 'total_amount'),
    amountColumn(filters.exclude_iva ? 'Base sin IVA' : 'Base (total)', 'base_amount'),
    { title: '% Comision', dataIndex: 'commission_percentage', key: 'commission_percentage', align: 'right', render: value => `${value}%` },
    amountColumn('Monto', 'commission_amount'),
    {
      title: 'Estado factura',
      dataIndex: 'is_paid',
      key: 'is_paid',
      render: (isPaid, record) =>
        record.is_cancelled ? <Tag color='red'>Anulada</Tag> : isPaid ? <Tag color='green'>Pagada</Tag> : <Tag color='orange'>No pagada</Tag>,
    },
    {
      title: 'Comision pagada',
      key: 'is_commission_paid',
      render: (_, record) => {
        if (!record.is_commission_paid) return record.is_paid ? <Tag color='gold'>Por pagar</Tag> : '-'

        const changed = Math.abs(record.commission_paid_amount - record.commission_amount) > 0.009
        const tag = <Tag color='green'>Pagada {formatAmount(record.commission_paid_amount)}</Tag>

        return (
          <>
            {changed ? (
              <Tooltip title={`Se pago ${formatAmount(record.commission_paid_amount)}; el calculo actual es ${formatAmount(record.commission_amount)}`}>
                {tag}
                <span style={{ color: '#d46b08' }}>*</span>
              </Tooltip>
            ) : (
              tag
            )}
            <Popconfirm title='¿Desmarcar la comision como pagada?' okText='Si' cancelText='No' onConfirm={() => markCommissions([record.id], false)}>
              <Button type='link' size='small'>
                Desmarcar
              </Button>
            </Popconfirm>
          </>
        )
      },
    },
  ]

  const sellerColumns = [
    { title: 'Vendedor', dataIndex: 'seller_name', key: 'seller_name' },
    { title: 'Comision', dataIndex: 'commission_percentage', key: 'commission_percentage', align: 'right', render: value => `${value}%` },
    { title: 'Facturas por pagar comision', key: 'to_pay_count', align: 'right', render: (_, r) => r.to_pay.invoices_count },
    { title: 'Comision por pagar', key: 'to_pay_commission', align: 'right', render: (_, r) => formatAmount(r.to_pay.commission_amount) },
    { title: 'Facturas comision pagada', key: 'paid_count', align: 'right', render: (_, r) => r.commission_paid.invoices_count },
    { title: 'Comision ya pagada', key: 'paid_commission', align: 'right', render: (_, r) => formatAmount(r.commission_paid.commission_amount) },
    { title: 'Facturas anuladas con comision pagada', key: 'cancelled_count', align: 'right', render: (_, r) => r.cancelled_paid.invoices_count },
    { title: 'Comision pagada a anuladas', key: 'cancelled_commission', align: 'right', render: (_, r) => formatAmount(r.cancelled_paid.commission_amount) },
    { title: 'Facturas no pagadas (cliente)', key: 'unpaid_count', align: 'right', render: (_, r) => r.unpaid.invoices_count },
    { title: 'Comision pendiente', key: 'unpaid_commission', align: 'right', render: (_, r) => formatAmount(r.unpaid.commission_amount) },
  ]

  return (
    <div>
      <HeaderPage title={'Reporte - Comisiones'} />

      <CollapsibleCards>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard title='Comision por pagar al vendedor (factura pagada)' totals={summary.to_pay} color='#389e0d' />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard title='Comision ya pagada al vendedor' totals={summary.commission_paid} color='#096dd9' />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard title='Comision pagada a facturas anuladas' totals={summary.cancelled_paid} color='#cf1322' />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard title='Comision pendiente (factura no pagada)' totals={summary.unpaid} color='#d46b08' />
        </Col>
      </Row>
      </CollapsibleCards>

      <Row gutter={16} className={'margin-top-15'}>
        <Col xs={24} sm={12} lg={4}>
          <RangePicker
            key={`range-${resetKey}`}
            style={{ width: '100%', height: '40px', borderRadius: '6px' }}
            format='DD-MM-YYYY'
            value={filters.dateRange}
            onChange={setFilter('dateRange')}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Select
            key={`client-${resetKey}`}
            className={'single-select'}
            placeholder={'Cliente'}
            size={'large'}
            style={{ width: '100%', height: '40px' }}
            getPopupContainer={trigger => trigger.parentNode}
            showSearch
            allowClear
            filterOption={false}
            onSearch={searchClients}
            value={filters.stakeholder_id}
            onChange={setFilter('stakeholder_id')}
          >
            {clientsOptions.map(client => (
              <Option key={client.id} value={client.id}>
                {client.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <SellerSelect key={`seller-${resetKey}`} includeInactive value={filters.seller_id} onChange={setFilter('seller_id')} />
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Select
            className={'single-select'}
            size={'large'}
            style={{ width: '100%', height: '40px' }}
            getPopupContainer={trigger => trigger.parentNode}
            dropdownMatchSelectWidth={false}
            value={filters.payment_status}
            onChange={setFilter('payment_status')}
          >
            <Option value='ALL'>Factura: todas</Option>
            <Option value='PAID'>Factura: pagadas</Option>
            <Option value='UNPAID'>Factura: no pagadas</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Select
            className={'single-select'}
            size={'large'}
            style={{ width: '100%', height: '40px' }}
            getPopupContainer={trigger => trigger.parentNode}
            dropdownMatchSelectWidth={false}
            value={filters.commission_status}
            onChange={setFilter('commission_status')}
          >
            <Option value='ALL'>Comision: todas</Option>
            <Option value='UNPAID'>Comision: por pagar</Option>
            <Option value='PAID'>Comision: pagada</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <div style={{ height: 40, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <Switch checked={filters.exclude_iva} onChange={setFilter('exclude_iva')} />
            <span style={{ marginLeft: 8 }}>Quitar IVA (12%)</span>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Button
            type='default'
            className='cabisa-clear-filters-button'
            style={{ width: '100%', height: '40px' }}
            onClick={clearFilters}
            icon={<CloseSquareOutlined />}
          >
            Limpiar
          </Button>
        </Col>
      </Row>

      <Card className={'card-border-radius margin-top-15'}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'sellers'
              ? exportButton('commissionsSellersReport', 'Reporte-comisiones-vendedores.xlsx')
              : (
                <>
                  {selectedKeys.length > 0 && (
                    <Popconfirm
                      title={`¿Marcar la comision de ${selectedKeys.length} factura(s) como pagada?`}
                      okText='Si'
                      cancelText='No'
                      onConfirm={() => markCommissions(selectedKeys, true)}
                    >
                      <Button type='primary' style={{ marginRight: 8 }}>
                        Marcar como pagadas ({selectedKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                  {exportButton('commissionsReport', 'Reporte-comisiones-facturas.xlsx')}
                </>
              )
          }
        >
          <TabPane tab='Resumen por vendedor' key='sellers'>
            <Table
              className={'CustomTableClass'}
              dataSource={summary.by_seller}
              columns={sellerColumns}
              loading={loading}
              pagination={false}
              rowKey='seller_id'
            />
          </TabPane>
          <TabPane tab='Facturas' key='invoices'>
            <Table
              className={'CustomTableClass'}
              dataSource={dataSource}
              columns={invoiceColumns}
              loading={loading}
              pagination={false}
              rowKey='id'
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: setSelectedKeys,
                // solo facturas 100% pagadas por el cliente y con comision sin pagar
                getCheckboxProps: record => ({ disabled: !record.is_paid || record.is_commission_paid }),
              }}
            />
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
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ReportCommissions
