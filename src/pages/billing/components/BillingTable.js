import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Divider,
  Tooltip,
  Button,
  Popconfirm,
  Tag as AntTag,
  Pagination,
} from 'antd'
import {
  DeleteOutlined,
  FileSearchOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import Tag from '../../../components/Tag'
import moment from 'moment'

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

function BillingTable(props) {
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)

  const handlerDeleteRow = data => props.handlerDeleteRow(data)

  const handlerShowDocument = data => props.handlerShowDocument(data)

  const handlerPrintDocument = data => props.handlerPrintDocument(data)

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
      render: text => <span>{text}</span>,
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
      title: 'Fecha de facturacion',
      dataIndex: 'created_at',
      key: 'created_at',
      render: text => (
        <span>{text ? moment(text).format('DD-MM-YYYY') : ''}</span>
      ),
    },
    {
      width: 120,
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: text => <span>{text.toFixed(2)}</span>,
    },
    {
      width: 120,
      title: 'Metodo de pago',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: text => <Tag type='documentsPaymentMethods' value={text} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: text => <Tag type='documentStatus' value={text} />,
    },
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: 175,
      render: (_, data) => (
        <>
          <Tooltip title={'Imprimir documento'}>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlerPrintDocument(data)}
            />
          </Tooltip>
          <Divider type={'vertical'} />
          <Tooltip title={'Ver documento'}>
            <Button
              icon={<FileSearchOutlined />}
              onClick={() => handlerShowDocument(data)}
            />
          </Tooltip>
          <Divider type={'vertical'} />
          <Tooltip title={'Anular'}>
            <Popconfirm
              title={`¿Estas seguro de anular la factura?`}
              onConfirm={() => handlerDeleteRow(data)}
              okText='Si'
              cancelText='No'
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </>
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Search
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='# Nota serv.'
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              size={'large'}
              onSearch={props.handleFiltersChange('related_internal_document_id')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Search
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='# Documento'
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              size={'large'}
              onSearch={props.handleFiltersChange('document_number')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Search
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Nombre Cliente'
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              size={'large'}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DatePicker
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
              placeholder='Fecha de facturacion'
              format='DD-MM-YYYY'
              onChange={props.handleFiltersChange('created_at')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              className={'single-select'}
              placeholder={'Metodo de pago'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('paymentMethods')}
              defaultValue=''
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
          <Col xs={24} sm={12} md={8} lg={4}>
            <Search
              type='tel'
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Total'
              className={'cabisa-table-search customSearch'}
              style={{ width: '100%', height: '40px' }}
              onSearch={props.handleFiltersChange('totalInvoice')}
              size={'large'}
            />
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

export default BillingTable
