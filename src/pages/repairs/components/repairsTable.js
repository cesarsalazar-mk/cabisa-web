import React from 'react'
import { Table, Col, Select, DatePicker, Row, Card, Tag as AntTag } from 'antd'
import ActionOptions from '../../../components/actionOptions'
import Tag from '../../../components/Tag'
import { documentsStatus, permissions } from '../../../commons/types'
import { formatDateOnly } from '../../../utils'

const { Option } = Select

const getColumns = ({
  handlerCancelRow,
  handlerEditRow,
  handlerApproveRow,
}) => [
  {
    title: 'Fecha Inicial',
    dataIndex: 'start_date', // Field that is goint to be rendered
    key: 'start_date',
    render: text =>
      text ? <span>{formatDateOnly(text)}</span> : '',
  },
  {
    title: 'Fecha Final',
    dataIndex: 'end_date', // Field that is goint to be rendered
    key: 'end_date',
    render: text =>
      text ? <span>{formatDateOnly(text)}</span> : '',
  },
  {
    title: 'Status',
    dataIndex: 'status', // Field that is goint to be rendered
    key: 'status',
    render: value => <Tag type='documentStatus' value={value} />,
  },
  {
    title: '',
    dataIndex: 'id', // Field that is goint to be rendered
    key: 'id',
    render: (_, data) => (
      <ActionOptions
        editPermissions={false}
        data={data}
        permissionId={permissions.REPARACIONES}
        handlerEditRow={handlerEditRow}
        editAction={data.status !== documentsStatus.PENDING ? 'show' : 'edit'}
        showDeleteBtn={data.status !== documentsStatus.CANCELLED}
        deleteAction='cancel'
        handlerDeleteRow={handlerCancelRow}
        showApproveBtn={data.status === documentsStatus.PENDING}
        approveAction='approve'
        handlerApproveRow={handlerApproveRow}
      />
    ),
  },
]

function RepairsTable(props) {
  const columns = getColumns({
    handlerEditRow: row => props.handlerEditRow(row),
    handlerCancelRow: row => props.handlerCancelRow(row.document_id),
    handlerApproveRow: row => props.handlerApproveRow(row.document_id),
  })

  return (
    <>
      <Row gutter={16}>
        <Col xs={6} sm={6} md={6} lg={6}>
          <DatePicker
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            placeholder='Fecha inicial'
            format='DD-MM-YYYY'
            onChange={props.handleFiltersChange('start_date')}
          />
        </Col>
        <Col xs={6} sm={6} md={6} lg={6}>
          <DatePicker
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            placeholder='Fecha final'
            format='DD-MM-YYYY'
            onChange={props.handleFiltersChange('end_date')}
          />
        </Col>
        <Col xs={6} sm={6} md={6} lg={6}>
          <Select
            defaultValue={''}
            className={'single-select'}
            placeholder={'Status'}
            size={'large'}
            style={{ width: '100%', height: '40px' }}
            getPopupContainer={trigger => trigger.parentNode}
            onChange={props.handleFiltersChange('status')}
          >
            <Option value={''}>
              <AntTag color='cyan'>Todo</AntTag>
            </Option>
            {props.statusOptionsList?.map(value => (
              <Option key={value} value={value}>
                <Tag type='documentStatus' value={value} />
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={24} md={24} lg={24}>
          <Card className={'card-border-radius margin-top-15'}>
            <Row>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Table
                  scroll={{ y: 320 }}
                  pagination={{ pageSize: 5 }}
                  className={'CustomTableClass'}
                  dataSource={props.dataSource}
                  columns={columns}
                  loading={props.loading}
                  rowKey='document_id'
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default RepairsTable
