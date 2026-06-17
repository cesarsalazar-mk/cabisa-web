import React, { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react'
import moment from 'moment'
import HeaderPage from '../../components/HeaderPage'
import BillingTable from './components/BillingTable'
import DetailBilling from './components/detailBilling'
import billingSrc from './billingSrc'
import { message,Modal,Row,Col,Input,Spin } from 'antd'
import { getPercent, showErrors, roundNumber, validateRole } from '../../utils'
import {
  stakeholdersTypes,
  permissions,
  //documentsServiceType,
  roles,
  documentsPaymentMethods,
} from '../../commons/types'
import { Cache } from 'aws-amplify'

const { TextArea } = Input;

const defaultPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}

const CONTENT_PADDING_BOTTOM = 24

function getAvailablePageHeight(pageTop) {
  const footer = document.querySelector('.ant-layout-footer')
  const footerHeight = footer?.getBoundingClientRect().height || 30

  return window.innerHeight - pageTop - footerHeight - CONTENT_PADDING_BOTTOM
}

export function getDetailData(data) {
  const getParentProduct = (products, childProduct) => {    
    if (!childProduct.parent_product_id) return {}    
    const parentProduct = products.find(
      p => Number(p?.id) === Number(childProduct?.parent_product_id)
    )

    const baseUnitPrice =
      parentProduct?.product_price || parentProduct?.unit_price || 0
    const unitDiscountAmount = parentProduct?.unit_discount_amount || 0
    const parentBaseUnitPrice =
      (Number(baseUnitPrice) + unitDiscountAmount) /
      (1 - getPercent(Number(parentProduct.tax_fee)))
    const unitPrice =
      Number(baseUnitPrice) / (1 - getPercent(Number(parentProduct.tax_fee)))
    const parentUnitTaxAmount = roundNumber(unitPrice - baseUnitPrice)
    // const unitPrice =
    //   parentProduct?.product_price || Number(parentProduct?.product_price) === 0
    //     ? Number(parentProduct.product_price)
    //     : Number(parentProduct?.unit_price || 0)

    return {
      id: parentProduct?.id || '',
      description: parentProduct?.description || '',
      parent_tax_fee: parentProduct?.tax_fee || 0,
      // parent_unit_tax_amount: roundNumber(parentProduct?.unit_tax_amount || 0),
      parent_unit_tax_amount: parentUnitTaxAmount,
      parent_unit_discount: roundNumber(unitDiscountAmount),
      parent_base_unit_price: roundNumber(parentBaseUnitPrice),
      // parent_base_unit_price: roundNumber(unitPrice + parent_unit_discount),
      parent_unit_price: roundNumber(unitPrice),
      parent_display_unit_price: roundNumber(unitPrice),
      unit_tax_amount: roundNumber(
        parentUnitTaxAmount + childProduct.unit_tax_amount
      ),
      subtotal: roundNumber(Number(unitPrice) + childProduct.subtotal),
    }
  }

  const products = data?.products?.flatMap(p => {
    
    // if (p.service_type === documentsServiceType.SERVICE && !p.parent_product_id)
    //   return []

    const baseUnitPrice = p?.product_price || p?.unit_price || 0
    const unitDiscountAmount = p?.unit_discount_amount || 0
    const childBaseUnitPrice =
      (Number(baseUnitPrice) + unitDiscountAmount) /
      (1 - getPercent(Number(p.tax_fee)))
    const unitPrice =
      Number(baseUnitPrice) / (1 - getPercent(Number(p.tax_fee)))
    // const unitPrice = p?.product_price || p?.unit_price || 0
    const quantity = p?.quantity || p?.product_quantity || 0
    const subtotal = unitPrice * quantity
    const unitTaxAmount = roundNumber(unitPrice - baseUnitPrice)
    //ledr - comment code
    return {
      ...p,
      child_id: p?.id || '',
      child_description: p?.description || '',
      child_tax_fee: p?.tax_fee || '0',
      // child_unit_tax_amount: roundNumber(p?.unit_tax_amount || 0),
      child_unit_tax_amount: unitTaxAmount,
      child_unit_discount: roundNumber(unitDiscountAmount),
      child_base_unit_price: roundNumber(childBaseUnitPrice),
      // child_base_unit_price: roundNumber(unitPrice + child_unit_discount),
      child_unit_price: roundNumber(unitPrice),
      child_display_unit_price: roundNumber(unitPrice),
      unit_price: roundNumber(unitPrice),
      unit_discount: roundNumber(unitDiscountAmount),
      unit_tax_amount: unitTaxAmount,
      quantity,
      subtotal: roundNumber(subtotal),
      id: '',
      description: '',
      // code: '',
      parent_tax_fee: 0,
      parent_unit_tax_amount: 0,
      parent_unit_discount: 0,
      parent_base_unit_price: 0,
      parent_unit_price: 0,
      ...getParentProduct(data.products, {
        ...p,
        product_price: unitPrice,
        subtotal,
      }),
    }
  })

  return {
    ...data,
    discount_percentage: roundNumber(data?.discount_percentage || 0),
    discount: roundNumber(data?.discount || 0),
    subtotal: roundNumber(data?.subtotal || 0),
    total_tax: roundNumber(data?.total_tax || 0),
    total: roundNumber(data?.total || 0),
    products,
  }
}

function Billing(props) {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      id: '',
      document_number: '',
      name:'',
      related_internal_document_id: '',
      nit: '',
      created_at: '',
      serviceTypes: '',
      paymentMethods: '',
      totalInvoice: '',
    }
  }

  const isAdmin = validateRole(roles.ADMIN)

  const [loading, setLoading] = useState(false)
  const [loadingBill, setLoadingBill] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [detailInvoiceData, setDetailInvoiceData] = useState(false)
  const [filters, setFilters] = useState(initFilters.current)
  const [pagination, setPagination] = useState(defaultPagination)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])
  const [
    stakeholderTypesOptionsList,
    setStakeholderTypesOptionsList,
  ] = useState([])
  const [serviceTypesOptionsList, setServiceTypesOptionsList] = useState([])
  const [showModal,setShowModal] = useState(false)
  const [showModalCancel,setShowModalCancel] = useState(false)
  const [invoiceBase64,setInvoiceBase64] = useState(null)
  const [cancelDescription,setCancelDescription] = useState('')
  const [dataCancelInvoice,setDataCancelInvoice] = useState(null)
  const [rowData,setRowData] = useState([])
  

  useEffect(() => {
    setPaymentMethodsOptionsList([
      documentsPaymentMethods.CARD,
      documentsPaymentMethods.CASH,
    ])

    setLoading(true)

    Promise.all([
      billingSrc.getStakeholderTypes(),
      billingSrc.getServiceTypes(),
    ])
      .then(data => {
        const stakeholdersTypesList = data[0].filter(
          s => s !== stakeholdersTypes.PROVIDER
        )

        setStakeholderTypesOptionsList(stakeholdersTypesList)
        setServiceTypesOptionsList(data[1])
      })
      .catch(_ => message.error('Error al cargar listados'))
      .finally(() => setLoading(false))
  }, [])

  const loadData = useCallback(() => {
    setLoading(true)

    billingSrc
      .getInvoices({
        related_internal_document_id: { $like: `%25${filters.related_internal_document_id}%25` },
        id: { $like: `%25${filters.id}%25` },
        name: { $like: `%25${filters.name}%25` },
        document_number: { $like: `%25${filters.document_number}%25` },
        nit: { $like: `%25${filters.nit}%25` },
        created_at: filters.created_at
          ? { $like: `${moment(filters.created_at).format('YYYY-MM-DD')}%25` }
          : '',
        payment_method: filters.paymentMethods,
        total_amount: { $like: `%25${filters.totalInvoice}%25` },
        $limit: pagination.pageSize,
        $offset: (pagination.current - 1) * pagination.pageSize,
      })
      .then(data => {
        setDataSource(data.items || data)
        setPagination(prevState => ({
          ...prevState,
          total: data.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar facturas'))
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  useLayoutEffect(() => {
    const updatePageHeight = () => {
      if (!pageRef.current) return

      const { top } = pageRef.current.getBoundingClientRect()
      setPageHeight(getAvailablePageHeight(top))
    }

    updatePageHeight()
    window.addEventListener('resize', updatePageHeight)

    const frameId = requestAnimationFrame(updatePageHeight)

    return () => {
      window.removeEventListener('resize', updatePageHeight)
      cancelAnimationFrame(frameId)
    }
  }, [loading, dataSource])

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const resetFilters = () => {
    setFilters(initFilters.current)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const handlerDeleteRow = async row => {
    
    try {
      if(showModalCancel){
        if(cancelDescription.length === 0){
          return message.warning('La anulacion del documento debe llevar una descripcion.')
        }
        const UserName = Cache.getItem('currentSession')         
        setLoading(true)
        setShowModalCancel(false)
        
        let _dataCancel = dataCancelInvoice
        _dataCancel.description = cancelDescription
        _dataCancel.created_by = UserName ? UserName.userName : 'system'
  
        let infileDoc = await billingSrc.cancelInvoiceFel(_dataCancel)
        let infileMessage = infileDoc.message  
  
        if(infileMessage === 'SUCCESSFUL'){        
          billingSrc
            .cancelInvoice({ document_id: rowData.id })
            .then(_ => {
              if (JSON.stringify(filters) === JSON.stringify(initFilters.current)) {
                loadData()
              } else {
                resetFilters()
              }
  
              message.success('Factura anulada exitosamente')
            })
            .catch(error => showErrors(error))
            .finally(() => setLoading(false))
        }else{
          setLoading(false)
          message.error(infileMessage)
        }
        
      }else{
        setLoading(true)
        const {stakeholder_nit,uuid } = row    
        let infileDoc = await billingSrc.getInvoiceFel(row.document_number)
        
        let data = {
          nit:stakeholder_nit,
          uuid,
          certificateDate: infileDoc.xml_certificado.fecha_certificacion
        }
        setCancelDescription('')
        setRowData(row)
        setDataCancelInvoice(data)      
        setShowModalCancel(true)
        setLoading(false)
      }
    } catch (error) {
      console.log(error)
      message.error('Ocurrio un problema al procesar su peticion, contacte al administrador')
    }
    
  }

  const handlerPrintDocument = async row => {  
    setLoading(true)
    let infileDoc = await billingSrc.getInvoiceFel(row.document_number)
    let uuid_ = infileDoc.xml_certificado.uuid
    setLoading(false)    
    let urlDocument = `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${uuid_}`
    window.open(urlDocument, '_blank').focus();
  }

  const handlerShowDocument = async row => {
    console.log("show document")
    console.log(row.document_number)
    setLoading(true)
    let infileDoc = await billingSrc.getInvoiceFel(row.document_number)
    setLoading(false)    
    let uuid_ = infileDoc.xml_certificado.uuid
    let urlPdf = `https://docs.google.com/gview?url=https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${uuid_}&embedded=true`
    console.log('document',urlPdf)    
    setInvoiceBase64(urlPdf)
    setLoadingBill(true)
    setShowModal(true)
    //open bill new tab
    // let urlDocument = `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${uuid_}`
    // window.open(urlDocument, '_blank').focus();
  }

  const setSearchFilters = field => value => {
    setPagination(prevState => ({ ...prevState, current: 1 }))
    setFilters(prevState => ({ ...prevState, [field]: value }))
  }

  const newBill = () => props.history.push('/billingView')

  const showDetail = data => {
    const detailInvoiceData = getDetailData(data)

    setDetailInvoiceData(detailInvoiceData)

    setVisible(true)
  }

  const closeDetail = () => setVisible(false)

  const hideSpinner = () =>{
    setLoadingBill(false)
  }

  return (
    <div
      ref={pageRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: pageHeight ?? undefined,
        maxHeight: pageHeight ?? undefined,
        overflow: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <HeaderPage
          titleButton={'Factura Nueva'}
          title={'Facturación'}
          showDrawer={newBill}
          permissions={permissions.FACTURACION}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <BillingTable
          dataSource={dataSource}
          showDetail={showDetail}
          handleFiltersChange={setSearchFilters}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          handlerDeleteRow={handlerDeleteRow}
          handlerShowDocument={handlerShowDocument}
          handlerPrintDocument={handlerPrintDocument}
          loading={loading}
          isAdmin={isAdmin}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
      <DetailBilling
        closable={closeDetail}
        visible={visible}
        loading={loading}
        setLoading={setLoading}
        editData={detailInvoiceData}
        paymentMethodsOptionsList={paymentMethodsOptionsList}
        stakeholderTypesOptionsList={stakeholderTypesOptionsList}
        serviceTypesOptionsList={serviceTypesOptionsList}
        isAdmin={isAdmin}
        loadData={loadData}
      />
       <Modal
          closable={false}
          width={'min-content'}
          visible={showModal}
          footer={false}
          onCancel={() => {
            setInvoiceBase64('_blank');
            setShowModal(false)
          }
          }
        >   
        <Spin spinning={loadingBill}>
          {invoiceBase64 && (
            <Row gutter={24}>
              <Col span={24}>
                <div style={{ width: '21cm', height: '29.7cm' }}>                  
                  <iframe
                  onLoad={hideSpinner}
                  title="calculator"
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: '100%', minHeight: '960px', height: '100%', borderColor: 'white' }}
                  src={invoiceBase64}
          />
                </div>
              </Col>
            </Row>
          )}
          </Spin>       
        </Modal>

        <Modal
          closable={false}          
          visible={showModalCancel}          
          onOk={()=>{           
            setShowModalCancel(false)
            handlerDeleteRow()
           }
          }
          onCancel={()=>{
            setShowModalCancel(false)
            setCancelDescription('')
            setRowData([])
            setDataCancelInvoice(null)
          }
        }
        >          
        
            <Row gutter={24}>
              <Col span={24}>
              <TextArea rows={4}
              value={cancelDescription} 
              placeholder='Descripcion de la anulacion'
              onChange={value=>setCancelDescription(value.target.value)}
              />
              </Col>
            </Row>          
        </Modal>
    </div>
  )
}
export default Billing
