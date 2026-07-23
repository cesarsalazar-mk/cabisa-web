import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Tag as AntTag,
  Pagination,
  Button,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import ActionOptions from '../../../components/actionOptions'
import Tag from '../../../components/Tag'
import { permissions } from '../../../commons/types'
import { formatGuatemalaDate } from '../../../utils'

const { Search } = Input
const { Option } = Select

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

function PaymentsTable(props) {
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
  ])

  const handlerEditRow = data => props.handlerEditRow(data)
  const handlerDeleteRow = data => props.handlerDeleteRow(data)

  const columns = [
    {
      width: 110,
      title: '# Recibo',
      dataIndex: 'id',
      key: 'id',
      render: text =>
        text ? <span>{text}</span> : <span>{'Factura del sistema'}</span>,
    },
    {
      width: 120,
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at ',
      render: text => (
        <span>{formatGuatemalaDate(text)}</span>
      ),
    },
    {
      width: 350,
      title: 'Cliente',
      dataIndex: 'client',
      key: 'client ',
      render: (_, record) => (
        <>
          <span>{record.stakeholder_name}</span>
          <br />
          <span>Nit: {record.stakeholder_nit}</span>
        </>
      ),
    },
    {
      width: 150,
      title: 'Monto',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: text => (text ? <span>{text.toFixed(2)}</span> : null),
    },
    {
      width: 150,
      title: 'Estado de Credito',
      dataIndex: 'status',
      key: 'status',
      render: text => <Tag type='creditStatus' value={text} />,
    },
    {
      width: 150,
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      render: (_, data) => (
        <ActionOptions
          editPermissions={false}
          data={data}
          permissionId={permissions.PAGOS}
          handlerEditRow={handlerEditRow}
          handlerDeleteRow={handlerDeleteRow}
          showDeleteBtn={true}
          deleteAction='nullify'
          editAction={'add_payment'}
        />
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              key={`manual-payment-id-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='# Documento'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('id')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              key={`manual-payment-name-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Nombre Cliente'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <DatePicker
              key={`manual-payment-date-${props.filtersResetKey}`}
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
              placeholder='Fecha de facturacion'
              format='DD-MM-YYYY'
              value={props.filters?.created_at}
              onChange={props.handleFiltersChange('created_at')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              key={`manual-payment-status-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Estado de Credito'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('status')}
              value={props.filters?.status ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.creditStatusOptionsList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='creditStatusManual' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button
              type='default'
              className='cabisa-clear-filters-button'
              style={{
                minWidth: 120,
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

export default PaymentsTable
