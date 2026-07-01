import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import moment from 'moment'
import {
  Table,
  Col,
  Input,
  Row,
  Card,
  DatePicker,
  Select,
  Tag as AntTag,
  message,
  Pagination,
  Button,
} from 'antd'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import ActionOptions from '../../../../components/actionOptions'
import Tag from '../../../../components/Tag'
import { useSale, saleActions } from '../../../sales/context'
import { showErrors } from '../../../../utils'

const { Search } = Input
const { Option } = Select
const { setSaleState, fetchSalesStatus, cancelSale } = saleActions

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

function ReportServiceOrderTable(props) {
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const [{ error, status, loading, ...saleState }, saleDispatch] = useSale()

  useEffect(() => {
    fetchSalesStatus(saleDispatch)
  }, [saleDispatch])

  useEffect(() => {
    if (props.isDrawerVisible) return

    if (status === 'ERROR') {
      showErrors(error)
      setSaleState(saleDispatch, { loading: null, error: null, status: 'IDLE' })
    }

    if (status === 'SUCCESS' && loading === 'cancelSale') {
      message.success('Venta cancelada exitosamente')
      props.loadData()
    }

    if (status === 'SUCCESS' && loading === 'approveSale') {
      message.success('Factura generada exitosamente.')
      props.loadData()
    }
  }, [error, status, loading, saleDispatch, props.isDrawerVisible, props.loadData])

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

  const handlerEditRow = async currentSale => {
    await setSaleState(saleDispatch, { currentSale })
    props.showDrawer(true)
  }

  const handlerApproveRow = row => {
    props.history.push({
      pathname: '/ServiceNoteBill',
      state: row,
    })
  }

  const handlerDeleteRow = row => {
    cancelSale(saleDispatch, { document_id: row.id })
  }

  const columns = [
    {
      width: 100,
      title: 'No. de boleta',
      dataIndex: 'id',
      key: 'id',
      render: text => <span>{text}</span>,
    },
    {
      width: 300,
      title: 'Cliente',
      dataIndex: 'stakeholder_name',
      key: 'stakeholder_name',
      render: text => <span>{text}</span>,
    },
    {
      width: 200,
      title: 'Proyecto',
      dataIndex: 'project_name',
      key: 'project_name',
      render: text => <span>{text}</span>,
    },
    {
      width: 100,
      title: 'Fecha Inicio',
      dataIndex: 'start_date',
      key: 'start_date',
      render: text => (
        <span>{text ? moment.utc(text).format('DD-MM-YYYY') : null}</span>
      ),
    },
    {
      width: 200,
      title: 'Observaciones',
      dataIndex: 'comments',
      key: 'comments',
      render: text => <span>{text}</span>,
    },
    {
      width: 100,
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      render: (_, data) => (
        <ActionOptions
          showApproveBtn={false}
          showDeleteBtn={false}
          editPermissions={false}
          data={data}
          permissionId={props.permissions}
          handlerDeleteRow={handlerDeleteRow}
          handlerEditRow={handlerEditRow}
          handlerApproveRow={handlerApproveRow}
          deleteAction='nullify'
          editAction='show'
        />
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
              title='Total ordenes'
              value={summary?.total_orders ?? 0}
            />
          </Col>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Aprobadas'
              value={summary?.approved_count ?? 0}
            />
          </Col>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Pendientes'
              value={summary?.pending_count ?? 0}
            />
          </Col>
          <Col {...summaryCardCol} style={cardColStyle}>
            <SummaryCard
              title='Anuladas'
              value={summary?.cancelled_count ?? 0}
            />
          </Col>
        </Row>

        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`ticket-${props.filtersResetKey}`}
              className={'customSearch'}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por No. de boleta'
              style={{ height: '40px' }}
              size={'large'}
              onSearch={value => props.setSearchFilters('id')(value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`client-${props.filtersResetKey}`}
              className={'customSearch'}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por Cliente'
              style={{ height: '40px' }}
              size={'large'}
              onSearch={value => props.setSearchFilters('name')(value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <DatePicker
              key={`start-date-${props.filtersResetKey}`}
              placeholder='Fecha de Inicio'
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
              format='DD-MM-YYYY'
              value={props.filters?.start_date}
              onChange={value => props.setSearchFilters('start_date')(value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              key={`status-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Status'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => props.setSearchFilters('status')(value)}
              value={props.filters?.status ?? ''}
            >
              <Option value={''}>
                <AntTag color='cyan'>Todo</AntTag>
              </Option>
              {saleState.salesStatusList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='documentStatus' value={value} />
                </Option>
              ))}
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
              loading={props.loading}
              className={'CustomTableClass'}
              dataSource={props.dataSource}
              columns={columns}
              pagination={false}
              rowKey='id'
              expandable={{
                expandedRowRender: record => (
                  <div className={'text-left'}>
                    <p>
                      <b>Observaciones: </b>{' '}
                      {record.comments !== null ? (
                        <AntTag color='blue'>{record.comments}</AntTag>
                      ) : (
                        ''
                      )}{' '}
                    </p>
                  </div>
                ),
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.comments &&
                  (expanded ? (
                    <DownOutlined onClick={e => onExpand(record, e)} />
                  ) : (
                    <RightOutlined onClick={e => onExpand(record, e)} />
                  )),
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

export default ReportServiceOrderTable
