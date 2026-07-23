import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Table,
  Col,
  Row,
  Card,
  DatePicker,
  Select,
  Tag as AntTag,
  Pagination,
  Input,
  Button,
} from 'antd'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import ActionOptions from '../../../../components/actionOptions'
import Tag from '../../../../components/Tag'
import { formatDateOnly } from '../../../../utils'
import { formatPhone } from '../../../../utils'

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

function SalesTable(props) {
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

  const columns = [
    {
      width: 120,
      title: 'No. de boleta',
      dataIndex: 'id',
      key: 'id',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: 'Fecha',
      dataIndex: 'start_date',
      key: 'start_date',
      render: text => (
        <span>{text ? formatDateOnly(text) : null}</span>
      ),
    },
    {
      width: 300,
      title: 'Empresa',
      dataIndex: 'stakeholder_name',
      key: 'stakeholder_name',
      render: text => <span>{text}</span>,
    },
    {
      width: 300,
      title: 'Proyecto',
      dataIndex: 'project_name',
      key: 'project_name',
      render: text => <span>{text}</span>,
    },
    {
      width: 100,
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: text => <Tag type='documentStatus' value={text} />,
    },
    {
      width: 200,
      title: '',
      dataIndex: 'id',
      key: 'actions',
      render: (_, data) => (
        <ActionOptions
          showApproveBtn={!data.has_related_invoice}
          showDeleteBtn={!data.has_related_invoice}
          editPermissions={false}
          data={data}
          permissionId={props.permissions}
          handlerDeleteRow={props.handlerDeleteRow}
          handlerEditRow={props.handlerEditRow}
          handlerApproveRow={props.handlerApproveRow}
          deleteAction='nullify'
          editAction={!data.has_related_invoice ? 'edit' : 'show'}
        />
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Search
              key={`sale-id-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por No. de boleta'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('saleId')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <DatePicker
              key={`sale-date-${props.filtersResetKey}`}
              style={{ width: '100%', height: '40px', borderRadius: '6px' }}
              placeholder='Buscar por fecha'
              format='DD-MM-YYYY'
              value={props.filters?.startDate}
              onChange={props.handleFiltersChange('startDate')}
            />
          </Col>
          <Col
            xs={24}
            sm={12}
            md={4}
            lg={4}
            className={props.warehouse ? 'stash-component' : ''}
          >
            <Select
              key={`sale-status-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Status'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('status')}
              value={props.filters?.status ?? ''}
            >
              <Option value={''}>
                <AntTag color='gray'>Todo</AntTag>
              </Option>
              {props.salesStatusList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='documentStatus' value={value} />
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
                      <b>Encargado </b>{' '}
                      {record.stakeholder_business_man !== null
                        ? record.stakeholder_business_man
                        : ''}{' '}
                    </p>
                    <p>
                      <b>Direccion: </b>{' '}
                      {record.stakeholder_address !== null
                        ? record.stakeholder_address
                        : ''}{' '}
                    </p>
                    <p>
                      <b>Telefono: </b>{' '}
                      {record.stakeholder_phone
                        ? formatPhone(record.stakeholder_phone)
                        : ''}{' '}
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

export default SalesTable
