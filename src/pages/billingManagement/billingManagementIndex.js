import React, { useCallback, useEffect, useState, useRef } from 'react'
import HeaderPage from '../../components/HeaderPage'
import BillingManagementTable from './components/billingManagementTable'
import BillingManagementFelTable from './components/billingManagementFelTable'
import BillingItemList from './components/billingItemList'
import moment from 'moment'
import { message, Modal, Row, Col, Input, Divider,Select, Spin } from 'antd'
import { permissions } from '../../commons/types'
import billingSrc from '../billing/billingSrc'
import { useEditableList } from '../../hooks'
import { Cache } from 'aws-amplify'

const { TextArea } = Input
const { Option } = Select
function BillingManagementIndex(props) {
  const initFilters = useRef()
  if (!initFilters.current) {
    initFilters.current = {
      nit: '',
      name: '',      
      created_at: '',
      related_bill_document_number: '',
    }
  }

  const initFiltersFel = useRef()
  if (!initFiltersFel.current) {
    initFiltersFel.current = {
      id: '',
      document_number: '',
      name: '',
      related_internal_document_id: '',
      nit: '',
      created_at: '',
      totalInvoice: '',
    }
  }

  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false) //default false
  const [filters, setFilters] = useState(initFilters.current)
  const [disableSubmit, setDisableSubmit] = useState(true)
  //FEL
  const [dataSourceFel, setDataSourceFel] = useState([])
  const [filtersFel, setFiltersFel] = useState(initFiltersFel.current)
  const [loadingBill, setLoadingBill] = useState(true)
  const [showBillForm, setShowBillForm] = useState(false) //default false
  const [billData, setBillData] = useState(null)

  const [itemListData, setItemListData] = useState([])
  const [reasonAdjust, setReasonAdjust] = useState('')
  const [creditOrDebit,setCreditOrDebit] = useState(null)
  
  const [loadingSpining,setLoadingSpining] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    billingSrc
      .getDebitCreditNotesData({
        nit: { $like: `%25${filters.nit}%25` },
        name: { $like: `%25${filters.name}%25` },        
        ...getDateRangeFilterReport(filters.created_at),
        related_bill_document_number: { $like: `%25${filters.related_bill_document_number}%25` }
      })
      .then(data => setDataSource(data))
      .catch(_ => message.error('Error al cargar reporte Venta de productos'))
      .finally(() => setLoading(false))    
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setSearchFilters = field => value => {
    setFilters(prevState => ({ ...prevState, [field]: value }))
  }

  const getDateRangeFilterReport = dateRange => {
    if (!dateRange) return {}

    return {
      start_date: {
        $gte: moment(dateRange[0]).format('YYYY-MM-DD'),
      },
      end_date: {
        $lte: moment(dateRange[1]).format('YYYY-MM-DD'),
      },
    }
  }

  const newBillAction = () => {    
    getBillData()
    setShowModal(true)
  }

  const clearAll = () => {
    setBillData(null)
    setShowModal(false)
    setShowBillForm(false)
    setItemListData([
      {
        payment_amount: null,
        payment_qty: null,
        payment_code: '',
        description: '',
      },
    ])
    setReasonAdjust('')
    setFiltersFel(initFiltersFel.current)
    setCreditOrDebit(null)
    setDisableSubmit(true)

  }

  const hideBillAction = () => {
    clearAll()
  }

  const submitInfo = async () => {
    setLoadingSpining(true)
    
    const validateListElements = itemListData.every((element) => {
      return !validateObject(element);
    });
  
    if(!reasonAdjust){
      setLoadingSpining(false)
      return message.error("Debes escribir un Motivo de ajuste")      
    }else if(!validateListElements){
      setLoadingSpining(false)
      return message.error("Todos los elementos de la lista de ajuste son obligatorios, los montos deben ser mayores a 0")
    }else if(!creditOrDebit){
      setLoadingSpining(false)
      return message.error("Debes seleccionar que tipo de documento deseas crear")
    }else if(!billData.uuid || !billData.document_number){
      setLoadingSpining(false)
      return message.error("No se puede crear el documento porque no existe Numero de referencia o autorizacion")
    }

    const clientObj = {
      id: billData?.stakeholder_id,
      name:billData?.stakeholder_name,
      address:billData?.stakeholder_address,
      email:billData?.stakeholder_email,
      nit:billData?.stakeholder_nit,
      phone:billData?.stakeholder_phone
   }
   const UserName = Cache.getItem('currentSession')            
   const invoiceIntems = {
    items: itemListData.flatMap( p => {return {...p, 
      payment_amount: Number(p.payment_amount.replace(/,/g, "")),
      payment_qty: Number(p.payment_qty.replace(/,/g, ""))
    }}),    
    fechaEmisionDocumentoOrigen : moment(billData?.created_at).format('YYYY-MM-DD'),    
    motivoAjuste: reasonAdjust,
    numeroAutorizacionDocumentoOrigen: billData?.uuid,
    numeroDocumentoOrigen: billData?.document_number,
    serieDocumentoOrigen: billData?.serie,
    created_by: UserName ? UserName.userName : 'system',
    documentType: creditOrDebit
   }  
    let requestObject = {client:clientObj, invoice:invoiceIntems}
  
    console.log("request Object ",requestObject);

    let infileDoc = await billingSrc.createDebitCreditNote(requestObject)    
    let infileMessage = infileDoc.message  
    
    if(infileMessage === 'SUCCESSFUL'){ 
      message.success("Creado exitosamente")
      setShowModal(false)    
      clearAll()
      loadData()
    }else{
      let messageError = "No se ha podido crear el documento"

      if(infileDoc.data.descripcion_errores.length > 0){
          messageError = infileDoc.data.descripcion_errores
            .map((error) => error.mensaje_error.split("Error -")[1])
            .join(" - ")

        if(messageError.length === 0){
          messageError = "No se ha podido crear el documento"
        }
      }
      message.error(messageError,5)
      setShowModal(false)    
      clearAll()
      loadData()
    }         
  }

  const validateObject = (objeto) => {
    return Object.values(objeto).some((valor) => {
      return valor === undefined || valor === null || valor === '' || valor <= 0;
    });
  }

  //Fact fel
  const setSearchFiltersFel = field => value => {
    setFiltersFel(prevState => ({ ...prevState, [field]: value }))
  }

  const selectDocument = data => {    
    setBillData(data)
    setShowBillForm(true)
    setDisableSubmit(false)
  }

  const getBillData = useCallback(() => {
    setLoadingBill(true)
    billingSrc
      .getInvoices({
        related_internal_document_id: {
          $like: `%25${filtersFel.related_internal_document_id}%25`,
        }, // Nro nota de servicio
        id: { $like: `%25${filtersFel.id}%25` }, // Nro de Serie
        name: { $like: `%25${filtersFel.name}%25` }, // nombre cliente
        document_number: { $like: `%25${filtersFel.document_number}%25` }, // Nro de Serie
        nit: { $like: `%25${filtersFel.nit}%25` },
        created_at: filtersFel.created_at
          ? {
              $like: `${moment(filtersFel.created_at).format('YYYY-MM-DD')}%25`,
            }
          : '',
        payment_method: filtersFel.paymentMethods,
        total_amount: { $like: `%25${filtersFel.totalInvoice}%25` },
      })
      .then(data => setDataSourceFel(data.items || data))
      .catch(_ => message.error('Error al cargar facturas'))
      .finally(() => setLoadingBill(false))
  }, [filtersFel])
  useEffect(() => {
    if (showModal) {
      getBillData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersFel])
  
  const {
    handleChange: handleChangeManualPayments,
    handleAdd: handleAddManualPayments,
    handleRemove: handleRemoveManualPayments,
  } = useEditableList({
    state: itemListData,
    setState: setItemListData,
    minimumLength: 0,
    initRow: {
      payment_amount: null,
      payment_qty: null,
      payment_code: '',
      description: ''      
    },
  })

  const billFormComponent = () => {
    return (
      <>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Cliente</div>
            <Input
              placeholder={'Nombre cliente'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.stakeholder_name}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>NIT</div>
            <Input
              placeholder={'NIT'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.stakeholder_nit}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Direccion</div>
            <Input
              placeholder={'Direccion'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.stakeholder_address}
              disabled
            />
          </Col>
        </Row>

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Email</div>
            <Input
              placeholder={'Email'}
              size={'large'}
              type={'email'}
              style={{ height: '40px' }}
              value={billData?.stakeholder_email}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Telefono</div>
            <Input
              placeholder={'Telefono'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.stakeholder_phone}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Proyecto</div>
            <Input
              placeholder={'Proyecto'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.project_name}
              disabled
            />
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Numero de documento</div>
            <Input
              placeholder={'Documento'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.document_number}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Numero de autorizacion</div>
            <Input
              placeholder={'Autorizacion'}
              size={'large'}
              style={{ height: '40px' }}
              value={billData?.uuid}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Nota de Credito ó Debito</div>
            <Select
                className={'single-select'}
                placeholder={'Credito/Debito'}
                size={'large'}
                style={{ width: '100%', height: '40px' }}
                getPopupContainer={trigger => trigger.parentNode}
                onChange={value =>
                  setCreditOrDebit(value)                  
                }
                value={creditOrDebit}                
              >
                    <Option key={"NCRE"} value={"NCRE"}>
                      <span>Nota de Credito</span>
                    </Option>
                    <Option key={"NDEB"} value={"NDEB"}>
                      <span>Nota de Debito</span>
                    </Option>
              </Select>
          </Col>
        </Row>
        <Divider className={'divider-custom-margins-users'} />
        <Row>
          <Col span={24}>
            <BillingItemList
              dataSource={itemListData}
              handleChangeManualPayments={handleChangeManualPayments}
              handleAddManualPayments={handleAddManualPayments}
              handleRemoveManualPayments={handleRemoveManualPayments}
              forbidEdition={false}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <TextArea
              rows={4}
              placeholder={'Motivo del ajuste'}
              value={reasonAdjust}
              onChange={e => setReasonAdjust(e.target.value)}
            />
          </Col>
        </Row>
      </>
    )
  }

  const handlerPrintDocument = async row => {      
    setLoading(true)    
    let uuid_ = row.uuid
    setLoading(false)    
    let urlDocument = `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${uuid_}`
    window.open(urlDocument, '_blank').focus();
  }

  return (
    <>
      <HeaderPage
        titleButton={'Crear'}
        title={'Nota de Debito / Credito'}
        showDrawer={newBillAction}
        permissions={permissions.FACTURACION}
      />
      <BillingManagementTable
        dataSource={dataSource}
        handleFiltersChange={setSearchFilters}
        loading={loading}
        isAdmin={true}
        handlerPrintDocument={handlerPrintDocument}
      />
      <Modal
        width={1800}
        centered
        title='Nueva Nota de Credito/Debito'
        visible={showModal}
        onOk={() => submitInfo()}
        onCancel={() => hideBillAction()}
        okButtonProps={{ disabled: disableSubmit }}
      >
        <Spin spinning={loadingSpining}>
        {showBillForm ? (
          billFormComponent()
        ) : (
          <Row>
            <Col span={24}>
              <BillingManagementFelTable
                dataSource={dataSourceFel}
                handleFiltersChange={setSearchFiltersFel}
                handlerShowDocument={selectDocument}
                loading={loadingBill}
                isAdmin={true}
              />
            </Col>
          </Row>
        )}
        </Spin>
      </Modal>
    </>
  )
}
export default BillingManagementIndex
