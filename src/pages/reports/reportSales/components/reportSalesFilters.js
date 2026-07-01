import React from 'react'
import debounce from 'lodash/debounce'
import { Col, DatePicker, Row, Select, Tag as AntTag, Button } from 'antd'
import CloseSquareOutlined from '@ant-design/icons/lib/icons/CloseSquareOutlined'
import Tag from '../../../../components/Tag'

const { RangePicker } = DatePicker
const { Option } = Select

function ReportSalesFilters(props) {
  return (
    <Row gutter={16} className={'margin-top-15'}>
      <Col xs={24} sm={12} md={5} lg={5}>
        <Select
          key={`client-${props.filtersResetKey}`}
          className={'single-select'}
          placeholder={'Buscar por cliente'}
          size={'large'}
          style={{ width: '100%', height: '40px' }}
          getPopupContainer={trigger => trigger.parentNode}
          allowClear
          showSearch
          onSearch={debounce(props.handleSearchStakeholder, 400)}
          value={props.filters.client_id}
          onChange={props.setSearchFilters('client_id')}
          loading={props.loading}
          optionFilterProp='children'
        >
          {props.stakeholdersOptionsList?.map(client => (
            <Option key={client.id} value={client.id}>
              {client.name}
            </Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={12} md={5} lg={5}>
        <RangePicker
          key={`date-range-${props.filtersResetKey}`}
          style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          format='DD-MM-YYYY'
          value={props.filters.dateRange}
          onChange={props.setSearchFilters('dateRange')}
        />
      </Col>
      <Col xs={24} sm={12} md={5} lg={5}>
        <Select
          key={`payment-method-${props.filtersResetKey}`}
          className={'single-select'}
          placeholder={'Seleccione Metodo de Pago'}
          size={'large'}
          style={{ width: '100%', height: '40px' }}
          getPopupContainer={trigger => trigger.parentNode}
          optionFilterProp='children'
          showSearch
          onChange={props.setSearchFilters('payment_method')}
          value={props.filters.payment_method ?? ''}
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
      <Col xs={24} sm={12} md={5} lg={5}>
        <Select
          key={`document-type-${props.filtersResetKey}`}
          className={'single-select'}
          placeholder={'Seleccione estado'}
          size={'large'}
          style={{ width: '100%', height: '40px' }}
          getPopupContainer={trigger => trigger.parentNode}
          optionFilterProp='children'
          showSearch
          onChange={props.setSearchFilters('document_type')}
          value={props.filters.document_type ?? ''}
        >
          <Option value={''}>
            <AntTag color='gray'>Todo</AntTag>
          </Option>
          <Option value={'SELL_INVOICE'}>
            <AntTag color='#187fce'>Factura Manual</AntTag>
          </Option>
          <Option value={'RENT_INVOICE'}>
            <AntTag color='#87d067'>Nota de Servicio</AntTag>
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
  )
}

export default ReportSalesFilters
