import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import moment from 'moment'
import {
  Table,
  Col,
  Input,
  Button,
  Row,
  Card,
  DatePicker,
  Select,
  Tag as AntTag,
  message,
  Pagination,
} from 'antd'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import DownOutlined from '@ant-design/icons/lib/icons/DownOutlined'
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined'
import ActionOptions from '../../../../components/actionOptions'
import Tag from '../../../../components/Tag'
import { useSale, saleActions } from '../../context'
import { validatePermissions, showErrors, formatPhone } from '../../../../utils'
import { actions } from '../../../../commons/types'

const { Search } = Input
const { Option } = Select
const { setSaleState, fetchSales, fetchSalesStatus, cancelSale } = saleActions

const defaultPagination = {
  current: 1,
  pageSize: 10,
}

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
  const [searchParams, setSearchParams] = useState({})
  const [pagination, setPagination] = useState(defaultPagination)
  const searchParamsRef = useRef(searchParams)
  const paginationRef = useRef(pagination)
  const tableSectionRef = useRef(null)
  const tableWrapperRef = useRef(null)
  const [tableScrollY, setTableScrollY] = useState(200)
  const [{ error, status, loading, salesPagination, ...saleState }, saleDispatch] =
    useSale()

  searchParamsRef.current = searchParams
  paginationRef.current = pagination

  const loadSales = useCallback(
    (overrides = {}) => {
      const current = overrides.current ?? paginationRef.current.current
      const pageSize = overrides.pageSize ?? paginationRef.current.pageSize
      const params = {
        ...searchParamsRef.current,
        ...overrides.params,
        $limit: pageSize,
        $offset: (current - 1) * pageSize,
      }

      fetchSales(saleDispatch, params)
    },
    [saleDispatch]
  )

  useEffect(() => {
    if (props.isDrawerVisible) return

    if (status === 'ERROR') {
      showErrors(error)
      setSaleState(saleDispatch, { loading: null, error: null, status: 'IDLE' })
    }

    if (status === 'SUCCESS' && loading === 'cancelSale') {
      message.success('Venta cancelada exitosamente')
      loadSales()
    }

    if (status === 'SUCCESS' && loading === 'approveSale') {
      message.success('Factura generada exitosamente')
      loadSales()
    }
  }, [error, status, loading, saleState, saleDispatch, props.isDrawerVisible, loadSales])

  useEffect(() => {
    loadSales()
    fetchSalesStatus(saleDispatch)
  }, [loadSales, saleDispatch])

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
    status,
    saleState?.sales?.length,
    pagination.pageSize,
    pagination.current,
  ])

  const getSearchParams = (key, value) => {
    if (key === 'text') return { id: { $like: `%25${value}%25` } }

    if (key === 'date') {
      const start_date = value
        ? { $like: `%25${moment(value).format('YYYY-MM-DD')}%25` }
        : ''
      return { start_date }
    }

    if (key === 'status') return { status: value }
  }

  const getFilteredData = (key, value) => {
    const newSearchParams = { ...searchParams, ...getSearchParams(key, value) }
    setSearchParams(newSearchParams)
    searchParamsRef.current = newSearchParams
    setPagination(prevState => ({ ...prevState, current: 1 }))
    paginationRef.current = { ...paginationRef.current, current: 1 }

    loadSales({
      current: 1,
      params: newSearchParams,
    })
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination({ current: page, pageSize })
    paginationRef.current = { current: page, pageSize }
    loadSales({ current: page, pageSize })
  }

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

  const can = validatePermissions(props.permissions)

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
        <span>{text ? moment.utc(text).format('DD-MM-YYYY') : null}</span>
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
          handlerDeleteRow={handlerDeleteRow}
          handlerEditRow={handlerEditRow}
          handlerApproveRow={handlerApproveRow}
          deleteAction='nullify'
          editAction={!data.has_related_invoice ? 'edit' : 'show'}
        />
      ),
    },
  ]

  return (
    <div style={pageLayoutStyle}>
      <div style={staticSectionStyle}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Search
              className={'customSearch'}
              prefix={<SearchOutlined className={'cabisa-table-search-icon'} />}
              placeholder='Buscar por No. de boleta'
              style={{ width: '100%', height: '40px' }}
              size={'large'}
              onSearch={e => getFilteredData('text', e)}
            />
          </Col>
          <Col xs={24} sm={12} md={5} lg={5}>
            <DatePicker
              placeholder={'Buscar por fecha'}
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
              format='DD-MM-YYYY'
              onChange={e => getFilteredData('date', e)}
            />
          </Col>
          <Col
            xs={24}
            sm={12}
            md={5}
            lg={5}
            className={props.warehouse ? 'stash-component' : ''}
          >
            <Select
              defaultValue={''}
              className={'single-select'}
              placeholder={'Status'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => getFilteredData('status', value)}
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
          <Col xs={24} sm={24} md={6} lg={6} className='text-right'>
            <Button
              className={
                can(actions.CREATE)
                  ? 'title-cabisa new-button'
                  : 'hide-component title-cabisa new-button'
              }
              onClick={props.newNote}
            >
              {props.buttonTitle}
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
              loading={status === 'LOADING' && loading === 'fetchSales'}
              className={'CustomTableClass'}
              dataSource={saleState?.sales}
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
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={salesPagination?.total || 0}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
          />
        </Card>
      </div>
    </div>
  )
}

export default SalesTable
