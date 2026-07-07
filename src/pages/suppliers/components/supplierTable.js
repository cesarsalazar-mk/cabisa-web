import React, { useLayoutEffect, useRef, useState } from 'react'
import { Table, Col, Input, Row, Card, Pagination, Button } from 'antd'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import ActionOptions from '../../../components/actionOptions'
import { permissions } from '../../../commons/types'
import { formatPhone } from '../../../utils'

const { Search } = Input

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

function SupplierTable(props) {
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
      width: 300,
      title: 'Nombre o Razón social',
      dataIndex: 'name',
      key: 'name',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: 'NIT',
      dataIndex: 'nit',
      key: 'nit',
      render: text => <span>{text}</span>,
    },
    {
      width: 220,
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: 'Telefono',
      dataIndex: 'phone',
      key: 'phone',
      render: text => (text ? formatPhone(text) : null),
    },
    {
      width: 300,
      title: 'Direccion',
      dataIndex: 'address',
      key: 'address',
      render: text => <span>{text}</span>,
    },
    {
      width: 120,
      title: '',
      dataIndex: 'id',
      key: 'id',
      render: (_, data) => (
        <ActionOptions
          editPermissions={false}
          data={data}
          permissionId={permissions.PROVEEDORES}
          showDeleteBtn
          handlerDeleteRow={props.handlerDeleteRow}
          handlerEditRow={props.handlerEditRow}
        />
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Search
              key={`supplier-search-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Busca por Nombre o Nit'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('searchText')}
            />
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
              pagination={false}
              className={'CustomTableClass'}
              dataSource={props.dataSource}
              columns={columns}
              loading={props.loading}
              rowKey='id'
              expandable={{
                expandedRowRender: record => (
                  <div className={'text-left'}>
                    <p>
                      <b>Encargado Compras: </b>{' '}
                      {record.sales !== null ? record.business_man : ''}{' '}
                    </p>
                    <p>
                      <b>Encargado Pagos: </b>{' '}
                      {record.shops !== null ? record.payments_man : ''}{' '}
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

export default SupplierTable
