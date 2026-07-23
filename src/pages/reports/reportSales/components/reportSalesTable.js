import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  Pagination,
  Row,
  Table,
  Tag as AntTag,
} from 'antd'
import Tag from '../../../../components/Tag'
import { formatGuatemalaDate } from '../../../../utils'
import DocumentTotalCell from '../../../../components/DocumentTotalCell'
import { numberFormat } from '../../../../utils'
import ReportSalesFilters from './reportSalesFilters'

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

const columns = [
  {
    title: 'Tipo',
    dataIndex: 'document_type',
    key: 'document_type',
    render: text =>
      text === 'RENT_INVOICE' ? (
        <AntTag color='#87d067'>Nota de servicio</AntTag>
      ) : (
        <AntTag color='#187fce'>Factura Manual</AntTag>
      ),
  },
  {
    title: '# Nota serv.',
    dataIndex: 'related_internal_document_id',
    key: 'related_internal_document_id',
    render: text => <span>{text}</span>,
  },
  {
    title: '# Documento',
    dataIndex: 'document_number',
    key: 'document_number',
    render: text => <span>{text ? text : 'Factura Sistema'}</span>,
  },
  {
    title: 'Fecha',
    dataIndex: 'created_at',
    key: 'created_at',
    render: text =>
      text ? <span>{formatGuatemalaDate(text, 'DD-MM-YYYY hh:mm:ss A')}</span> : null,
  },
  {
    title: 'Metodo de pago',
    dataIndex: 'payment_method',
    key: 'payment_method',
    render: text => <Tag type='documentsPaymentMethods' value={text} />,
  },
  {
    title: 'Monto',
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
    title: 'Cliente',
    dataIndex: 'stakeholder_name',
    key: 'stakeholder_name',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Estado',
    dataIndex: 'credit_status',
    key: 'credit_status',
    render: text => <Tag type='creditStatus' value={text} />,
  },
]

function ReportSalesTable(props) {
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

  const { summary } = props

  return (
    <div style={pageLayoutStyle}>
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
              title='Cantidad de documentos'
              value={summary?.total_documents ?? 0}
            />
          </Col>
        </Row>

        <ReportSalesFilters
          loading={props.loading}
          filters={props.filters}
          filtersResetKey={props.filtersResetKey}
          setSearchFilters={props.setSearchFilters}
          onClearFilters={props.onClearFilters}
          handleSearchSeller={props.handleSearchSeller}
          sellersOptionsList={props.sellersOptionsList}
          handleSearchStakeholder={props.handleSearchStakeholder}
          stakeholdersOptionsList={props.stakeholdersOptionsList}
          paymentMethodsOptionsList={props.paymentMethodsOptionsList}
        />
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

export default ReportSalesTable
