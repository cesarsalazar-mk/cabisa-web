import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  DatePicker,
  Input,
  Pagination,
  Row,
  Table,
  Tooltip,
  Button,
  Select,
  Tag as AntTag,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import Tag from '../../../components/Tag'
import moment from 'moment'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const summaryCardCol = { xs: 24, sm: 12, md: 8, lg: 8 }

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

function BillingManagementTable(props) {
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

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 50,
      render: text => <span>{text}</span>,
    },
    {
      title: 'Nombre',
      dataIndex: 'stakeholder_name',
      key: 'stakeholder_name',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Nit',
      dataIndex: 'stakeholder_nit',
      key: 'stakeholder_nit',
      render: text => <span>{text}</span>,
    },
    {
      title: '# Documento',
      dataIndex: 'document_number',
      key: 'document_number',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'document_type',
      key: 'document_type',
      render: text => <Tag type='creditDebitNote' value={text} />,
    },
    {
      title: 'Motivo del ajuste',
      dataIndex: 'adjustment_reason',
      key: 'adjustment_reason',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Fecha de Creacion',
      dataIndex: 'created_at',
      key: 'created_at',
      render: text => (
        <span>{text ? moment.utc(text).format('DD-MM-YYYY') : ''}</span>
      ),
    },
    {
      title: 'Referencia # Documento',
      dataIndex: 'related_bill_document_number',
      key: 'related_bill_document_number',
      render: text => <span>{text}</span>,
    },
    {
      width: 100,
      render: (_, data) => (
        <Tooltip title='Ver documento'>
          <Button
            icon={<SearchOutlined />}
            onClick={() => props.handlerPrintDocument(data)}
          />
        </Tooltip>
      ),
    },
  ]

  const { summary } = props

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={[16, 16]} align='stretch'>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Total notas'
              value={summary?.total_notes ?? 0}
            />
          </Col>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Notas de debito'
              value={summary?.debit_count ?? 0}
            />
          </Col>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Notas de credito'
              value={summary?.credit_count ?? 0}
            />
          </Col>
        </Row>

        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Search
              key={`name-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Nombre'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('name')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Search
              key={`nit-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Nit'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('nit')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Search
              key={`reference-${props.filtersResetKey}-${props.filters?.related_bill_document_number || ''}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Referencia # Documento'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              defaultValue={props.filters?.related_bill_document_number || undefined}
              onSearch={props.handleFiltersChange('related_bill_document_number')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <RangePicker
              key={`date-range-${props.filtersResetKey}`}
              style={{ width: '100%', height: '40px', borderRadius: '6px' }}
              format='DD-MM-YYYY'
              value={props.filters?.dateRange}
              onChange={props.handleFiltersChange('dateRange')}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Select
              key={`document-type-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Tipo'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('document_type')}
              value={props.filters?.document_type ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              <Option value={'CREDITO'}>
                <Tag type='creditDebitNote' value='CREDITO' />
              </Option>
              <Option value={'DEBITO'}>
                <Tag type='creditDebitNote' value='DEBITO' />
              </Option>
            </Select>
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

export default BillingManagementTable
