import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Table,
  Col,
  Input,
  Button,
  Row,
  Card,
  Tag as AntTag,
  Select,
  Pagination,
} from 'antd'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import { validatePermissions } from '../../../../utils'
import {
  documentsStatus,
  permissions,
  actions,
} from '../../../../commons/types'
import Tag from '../../../../components/Tag'

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

function InventoryMovementTable(props) {
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const can = validatePermissions(permissions.INVENTARIO)

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

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16} className={'margin-top-15'}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Search
              key={`movement-doc-${props.filtersResetKey}`}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por Nro de Documento'
              className={'cabisa-table-search customSearch'}
              size={'large'}
              onSearch={props.handleFiltersChange('documentNumber')}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              key={`movement-status-${props.filtersResetKey}`}
              className={'single-select'}
              placeholder={'Status'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={props.handleFiltersChange('status')}
              value={props.filters?.status ?? ''}
            >
              <Option value={''}>
                <AntTag color='grey'>Todo</AntTag>
              </Option>
              <Option value={documentsStatus.APPROVED}>
                <Tag type='documentStatus' value={documentsStatus.APPROVED} />
              </Option>
              <Option value={documentsStatus.CANCELLED}>
                <Tag type='documentStatus' value={documentsStatus.CANCELLED} />
              </Option>
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
          <Col
            xs={24}
            sm={24}
            md={10}
            lg={10}
            style={{ textAlign: 'right' }}
          >
            {can(actions.CREATE) && (
              <Button
                className='title-cabisa new-button'
                onClick={props.goCreateNewItem}
              >
                Nuevo Item
              </Button>
            )}
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
              columns={props.columns}
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

export default InventoryMovementTable
