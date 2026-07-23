import React, { useEffect, useState } from 'react'
import {
  Col,
  Divider,
  Input,
  Row,
  Select,
  Statistic,
  Typography,
  Collapse,
  Button,
  message
} from 'antd'

import { styleReceipt } from '../../receiptTemp/styleReceipt'
import { receiptTemplate } from '../../receiptTemp/receiptTemplate'
import PaymentsList from './manualPaymentsList'
import Tag from '../../../components/Tag'
import { useEditableList } from '../../../hooks'
import {
  roundNumber,
  showErrors,
  formatPhone,
  numberFormat,
  formatDateOnly,
} from '../../../utils'
import FooterButtons from '../../../components/FooterButtons'
import { documentsStatus } from '../../../commons/types'
import logoCabisa from '../../../assets/cabisa-logo.png'

const { Title } = Typography
const { Option } = Select
const { Panel } = Collapse

const { getFormattedValue, getValue } = numberFormat()

const getPaymentsTotal = (payments, totalUnpaidCredit) =>
  payments?.reduce(
    (r, p) => ({
      totalPayments: roundNumber(
        (r.totalPayments || 0) + getValue(p.payment_amount)
      ),
      totalUnpaidCredit: roundNumber(
        r.totalUnpaidCredit - getValue(p.payment_amount)
      ),
    }),
    { totalUnpaidCredit }
  )

const getSaveData = data => {
  const payments = data.payments?.map(p => {    
    return ({
    payment_id: p?.payment_id,
    payment_method: p.payment_method,
    payment_amount: p.payment_amount ? getValue(p.payment_amount) : null,
    payment_date: p.payment_date ? new Date(p.payment_date).toISOString(): null,    
    related_external_document: p.related_external_document,
    description: p.description,
    attachment_url: p.attachment_url || null,
  })}
  )  
  return { document_id: data?.id, payments, total_amount:data?.total_amount }
}

const validateSaveData = (data, totalUnpaidCredit) => {
  const errors = []
  const requiredFields = [
    { key: 'payment_date', value: 'Fecha de Pago' },
    { key: 'payment_amount', value: 'Monto' },
    { key: 'payment_method', value: 'Metodo de pago' },
  ]

  const requiredErrors = data.payments?.flatMap((p, i) => {
    const hasError = requiredFields.some(field => !p[field.key])
    return hasError ? i + 1 : []
  })

  if (requiredErrors.length > 0) {
    requiredErrors.forEach(position => {
      errors.push(
        `Debe llenar los campos Fecha de Pago, Monto y Metodo de pago en la posicion ${position}`
      )
    })
  }

  if (totalUnpaidCredit < 0)
    errors.push(
      'El total de pagos no puede ser superior al credito de la factura'
    )

  return {
    isInvalid: errors.length > 0,
    error: {
      message: errors,
    },
  }
}

function PaymentsFields({ detailData, ...props }) {
  const [paymentsData, setPaymentsData] = useState([])
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalUnpaidCredit, setTotalUnpaidCredit] = useState([])
  const [invoiceData, setInvoiceData] = useState({})
  

  useEffect(() => {
    if (!detailData) return

    setPaymentsData(detailData?.payments || [])
      
    setInvoiceData(prevState => ({
      ...detailData,
      stakeholder_phone: formatPhone(detailData.stakeholder_phone),
      ...prevState,
    }))

    
  }, [detailData])

  useEffect(() => {
    if (paymentsData?.length === 0) return

    const totals = getPaymentsTotal(paymentsData, invoiceData.total_amount)

    setTotalPayments(totals?.totalPayments)
    setTotalUnpaidCredit(totals?.totalUnpaidCredit)
  }, [paymentsData, invoiceData])

  useEffect(function cleanUp() {
    return () => {
      setInvoiceData({})      
      setPaymentsData([])
      setTotalPayments(0)
    }
  }, [])

  useEditableList({
    state: paymentsData,
    setState: setPaymentsData,
    initRow: {
      payment_date: '',
      payment_amount: '',
      payment_method: '',
      related_external_document: '',
      description: '',
      attachment_url: '',
    },
  })

  const {
    handleChange: handleChangeManualPayments,
    handleAdd: handleAddManualPayments,
    handleRemove: handleRemoveManualPayments,
  } = useEditableList({
    state: paymentsData,
    setState: setPaymentsData,
    minimumLength: 0,
    initRow: {
      payment_date: '',
      payment_amount: '',
      payment_method: '',
      related_external_document: '',
      description: '',
      attachment_url: '',
    },
  })

  const saveData = () => {    
    const saveData = getSaveData({ ...invoiceData, payments: paymentsData })    
    const { isInvalid, error } = validateSaveData(saveData, totalUnpaidCredit)
    if (isInvalid) return showErrors(error)
    props.handleSaveData(saveData)
  }

  const printDocument = () => {        
    let ticketItems = ''    
    let styleSheet = styleReceipt.replace("@@cabisaLogo",logoCabisa)
    let ticket = receiptTemplate.replace('@@nombre', invoiceData.stakeholder_name)
    ticket = ticket.replace('@@styleFile', styleSheet)
    ticket = ticket.replace('@@numero_recibo', invoiceData.id)
    ticket = ticket.replace('@@direccion', invoiceData.stakeholder_address)
    ticket = ticket.replace('@@email', invoiceData.stakeholder_email)
    ticket = ticket.replace('@@telefono', invoiceData.stakeholder_phone)
    ticket = ticket.replace('@@proyecto', invoiceData.project_name)
    ticket = ticket.replace('@@total_pagado', parseFloat(totalPayments).toFixed(2))
    ticket = ticket.replace('@@total_pendiente', parseFloat(totalUnpaidCredit).toFixed(2))
    ticket = ticket.replace('Fact No. @@numero_factura', "")
    
    if(invoiceData.payments.length > 0){      
      invoiceData.payments.forEach(items =>{      
        ticketItems += ` <tr class="service">
                        <td class="tableitem"><p class="itemtext">&nbsp;&nbsp;${formatDateOnly(items.payment_date)}</p></td>
                        <td class="tableitem"><p class="itemtext">Q.${parseFloat(items.payment_amount).toFixed(2)}</p></td>
                        <td class="tableitem"><p class="itemtext">${paymentMethod(items.payment_method)}</p></td>
                        <td class="tableitem"><p class="itemtext">${items.related_external_document ? items.related_external_document : ''}</p></td>
                        <td class="tableitem"><p class="itemtext">${items.description ? items.description : ''}</p></td>
                      </tr> `
      })      
    let mywindow = window.open('', 'PRINT', 'height=850,width=850')
    ticket = ticket.replace('@@itemList', ticketItems)
    mywindow.document.write(ticket)
    mywindow.document.close()
    mywindow.focus()
    }else{
      message.warning("No existen movimientos en este recibo")
    }
  }
  
  const paymentMethod = id => {
    switch (id) {
      case "CARD":
        return "Crédito"        
      case "CASH":
        return "Pago en efectivo"        
      case "CHECK":
        return "Cheque"        
      case "DEPOSIT":
        return "Deposito"        
      case "TRANSFER":
        return "Transferencia"            
      default:
        return "Ninguno"
    }
  }

  return (
    <>
      <Row>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Title>Recibo de caja Manual</Title>
        </Col>        
        <Col xs={24} sm={24} md={12} lg={12} style={{ textAlign: 'right' }}>          
            <Button onClick={printDocument} className='title-cabisa new-button'>
              <span>Imprimir recibo</span>
            </Button>          
        </Col>
      </Row>

      <Divider className={'divider-custom-margins-users'} />

      <Collapse>
        <Panel header='Informacion' key='1'>
          <Row gutter={16} className={'section-space-field'}>            
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Estado de Credito</div>
              <Select
                className={'single-select'}
                placeholder={'Estado de Credito'}
                size={'large'}
                style={{ width: '100%' }}
                value={invoiceData?.credit_status}
                disabled
              >
                <Option value={invoiceData?.credit_status}>
                  <Tag type='creditStatus' value={invoiceData?.credit_status} />
                </Option>
              </Select>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Metodo de pago</div>
              <Select
                className={'single-select'}
                placeholder={'Metodo de pago'}
                size={'large'}
                style={{ width: '100%', height: '40px' }}
                value={invoiceData?.payment_method}
                disabled
              >
                <Option value={invoiceData?.payment_method}>
                  <Tag
                    type='documentsPaymentMethods'
                    value={invoiceData?.payment_method}
                  />
                </Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={16} className={'section-space-field'}>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Cliente</div>
              <Select
                disabled
                className={'single-select'}
                placeholder={'Buscar cliente'}
                size={'large'}
                style={{ width: '100%' }}
                value={invoiceData?.stakeholder_id}
              >
                <Option value={invoiceData?.stakeholder_id}>
                  {invoiceData?.stakeholder_name}
                </Option>
              </Select>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Tipo de cliente</div>
              <Select
                className={'single-select'}
                placeholder={'Elegir tipo de cliente'}
                size={'large'}
                style={{ width: '100%' }}
                value={invoiceData?.stakeholder_type}
                disabled
              >
                <Option value={invoiceData?.stakeholder_type}>
                  <Tag
                    type='stakeholderTypes'
                    value={invoiceData?.stakeholder_type}
                  />
                </Option>
              </Select>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Proyecto</div>
              <Select
                className={'single-select'}
                placeholder={'Proyecto'}
                size={'large'}
                style={{ width: '100%', height: '40px' }}
                value={invoiceData?.project_id}
                disabled
              >
                <Option value={invoiceData?.project_id}>
                  {invoiceData?.project_name}
                </Option>
              </Select>
            </Col>
          </Row>
        
          <Row gutter={16} className={'section-space-field'}>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>NIT</div>
              <Input
                placeholder={'Escribir NIT'}
                size={'large'}
                style={{ height: '40px' }}
                value={invoiceData?.stakeholder_nit}
                disabled
              />
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Email</div>
              <Input
                placeholder={'Escribir email'}
                size={'large'}
                type={'email'}
                style={{ height: '40px' }}
                value={invoiceData?.stakeholder_email}
                disabled
              />
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Telefono</div>
              <Input
                placeholder={'Escribir telefono'}
                size={'large'}
                style={{ height: '40px' }}
                value={invoiceData?.stakeholder_phone}
                disabled
              />
            </Col>
          </Row>
          <Row gutter={16} className={'section-space-field'}>
            <Col xs={8} sm={8} md={8} lg={8}>
              <div className={'title-space-field'}>Direccion</div>
              <Input
                placeholder={'Escribir direccion'}
                size={'large'}
                style={{ height: '40px' }}
                value={invoiceData?.stakeholder_address}
                disabled
              />
            </Col>
            {invoiceData?.credit_days ? (
              <Col xs={8} sm={8} md={8} lg={8}>
                <div className={'title-space-field'}>Dias de Credito</div>
                <Select
                  className={'single-select'}
                  placeholder={'Dias de credito'}
                  size={'large'}
                  style={{ width: '100%', height: '40px' }}
                  value={invoiceData?.credit_days}
                  disabled
                >
                  <Option value={invoiceData?.credit_days}>
                    {invoiceData?.credit_days}
                  </Option>
                </Select>
              </Col>
            ) : null}
            {invoiceData?.discount_percentage ? (
              <Col xs={8} sm={8} md={8} lg={8}>
                <div className={'title-space-field'}>Descuento (%)</div>
                <Input
                  type='tel'
                  placeholder={'Aplicar Descuento'}
                  size={'large'}
                  style={{ height: '40px', width: '100%' }}
                  value={invoiceData?.discount_percentage}
                  disabled
                />
              </Col>
            ) : null}
          </Row>

          <Divider className={'divider-custom-margins-users'} />

          <Row gutter={16} style={{ textAlign: 'right' }} justify='end'>
            <Col span={6} style={{ textAlign: 'right' }}>
              {invoiceData?.total_discount_amount ? (
                <div className={'title-space-field'}>
                  <Statistic
                    title='Descuento :'
                    value={getFormattedValue(
                      invoiceData?.total_discount_amount
                    )}
                  />
                </div>
              ) : null}
            </Col>            
            <Col span={12} style={{ textAlign: 'right' }}>
              <div className={'title-space-field'}>
                <Statistic
                  title='Total :'
                  value={getFormattedValue(invoiceData?.total_amount)}
                />
              </div>
            </Col>
          </Row>

          <Divider className={'divider-custom-margins-users'} />
         
        </Panel>
      </Collapse>

      <Divider className={'divider-custom-margins-users'} />

      <div>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={24} sm={24} md={24} lg={24}>
            <PaymentsList
              dataSource={paymentsData}
              paymentMethodsOptionsList={props.paymentMethodsOptionsList}
              handleChangeManualPayments={handleChangeManualPayments}
              handleAddManualPayments={handleAddManualPayments}
              handleRemoveManualPayments={handleRemoveManualPayments}
              forbidEdition={invoiceData?.status === documentsStatus.CANCELLED}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ textAlign: 'right' }} justify='end'>
          <Col span={6} style={{ textAlign: 'right' }}>
            {paymentsData.length > 0 ? (
              <div className={'title-space-field'}>
                <Statistic
                  title='Total pagos :'
                  value={getFormattedValue(totalPayments)}
                />
              </div>
            ) : null}
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            {paymentsData.length > 0 ? (
              <div className={'title-space-field'}>
                <Statistic
                  title='Total pendiente :'
                  value={getFormattedValue(totalUnpaidCredit)}
                />
              </div>
            ) : null}
          </Col>
        </Row>
      </div>

      {invoiceData?.status !== documentsStatus.CANCELLED ? (
        <FooterButtons
          saveData={saveData}
          edit
          cancelButton={props.cancelButton}
          loading={props.loading}
        />
      ) : null}
    </>
  )
}
export default PaymentsFields
