import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from 'react'
import HeaderPage from '../../components/HeaderPage'
import BillingManagementTable from './components/billingManagementTable'
import BillingManagementFelTable from './components/billingManagementFelTable'
import BillingItemList from './components/billingItemList'
import { message, Modal, Row, Col, Input, Divider, Select, Spin } from 'antd'
import { permissions } from '../../commons/types'
import billingSrc from '../billing/billingSrc'
import { useEditableList } from '../../hooks'
import { Cache } from 'aws-amplify'
import { getDateRangeFilter, getSingleDateFilter, formatGuatemalaDate } from '../../utils'

const { TextArea } = Input
const { Option } = Select

const emptySummary = {
  total_notes: 0,
  debit_count: 0,
  credit_count: 0,
}

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

function parseDocumentRefFromSearch(search = '') {
  const params = new URLSearchParams(search)
  return params.get('related_bill_document_number') || ''
}

function BillingManagementIndex(props) {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const initFilters = useRef()
  if (!initFilters.current) {
    initFilters.current = {
      nit: '',
      name: '',
      dateRange: null,
      related_bill_document_number: '',
      document_type: '',
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
      created_at: null,
      totalInvoice: '',
    }
  }

  const [dataSource, setDataSource] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({
    ...initFilters.current,
    related_bill_document_number: parseDocumentRefFromSearch(
      props.location?.search
    ),
  }))
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [disableSubmit, setDisableSubmit] = useState(true)
  //FEL
  const [dataSourceFel, setDataSourceFel] = useState([])
  const [filtersFel, setFiltersFel] = useState(initFiltersFel.current)
  const [filtersResetKeyFel, setFiltersResetKeyFel] = useState(0)
  const [paginationFel, setPaginationFel] = useState(defaultPagination)
  const [loadingBill, setLoadingBill] = useState(false)
  const [showBillForm, setShowBillForm] = useState(false) //default false
  const [billData, setBillData] = useState(null)

  const [itemListData, setItemListData] = useState([])
  const [reasonAdjust, setReasonAdjust] = useState('')
  const [creditOrDebit, setCreditOrDebit] = useState(null)

  const [loadingSpining, setLoadingSpining] = useState(false)

  const getReportParams = (
    page = pagination.current,
    pageSize = pagination.pageSize,
    withPagination = true
  ) => ({
    nit: { $like: `%25${filters.nit || ''}%25` },
    name: { $like: `%25${filters.name || ''}%25` },
    ...getDateRangeFilter(filters.dateRange),
    related_bill_document_number: {
      $like: `%25${filters.related_bill_document_number || ''}%25`,
    },
    ...(filters.document_type ? { document_type: filters.document_type } : {}),
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const loadData = useCallback(() => {
    setLoading(true)
    billingSrc
      .getDebitCreditNotesData(getReportParams())
      .then(result => {
        setDataSource(result.items || result)
        setSummary(result.summary || emptySummary)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar notas de debito/credito'))
      .finally(() => setLoading(false))
  }, [filters, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const docRef = parseDocumentRefFromSearch(props.location?.search)

    setFilters(prevState => {
      if (prevState.related_bill_document_number === docRef) return prevState

      return {
        ...prevState,
        related_bill_document_number: docRef,
      }
    })

    if (docRef) {
      setPagination(prevState => ({ ...prevState, current: 1 }))
      setFiltersResetKey(prevState => prevState + 1)
    }
  }, [props.location?.search])

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
  }, [loading, summary, dataSource])

  const setSearchFilters = field => value => {
    const nextValue =
      field === 'dateRange'
        ? value || null
        : value === undefined || value === null
        ? ''
        : value
    setFilters(prevState => ({ ...prevState, [field]: nextValue }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current, dateRange: null })
    setPagination(prevState => ({ ...prevState, current: 1 }))
    setFiltersResetKey(prevState => prevState + 1)

    if (props.location?.search) {
      props.history?.replace('/billManagement')
    }
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const newBillAction = () => {
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
    setFiltersFel({ ...initFiltersFel.current, created_at: null })
    setFiltersResetKeyFel(prevState => prevState + 1)
    setPaginationFel(defaultPagination)
    setCreditOrDebit(null)
    setDisableSubmit(true)
  }

  const hideBillAction = () => {
    clearAll()
  }

  const submitInfo = async () => {
    setLoadingSpining(true)

    const validateListElements = itemListData.every(element => {
      return !validateObject(element)
    })

    if (!reasonAdjust) {
      setLoadingSpining(false)
      return message.error('Debes escribir un Motivo de ajuste')
    } else if (!validateListElements) {
      setLoadingSpining(false)
      return message.error(
        'Todos los elementos de la lista de ajuste son obligatorios, los montos deben ser mayores a 0'
      )
    } else if (!creditOrDebit) {
      setLoadingSpining(false)
      return message.error(
        'Debes seleccionar que tipo de documento deseas crear'
      )
    } else if (!billData.uuid || !billData.document_number) {
      setLoadingSpining(false)
      return message.error(
        'No se puede crear el documento porque no existe Numero de referencia o autorizacion'
      )
    }

    const clientObj = {
      id: billData?.stakeholder_id,
      name: billData?.stakeholder_name,
      address: billData?.stakeholder_address,
      email: billData?.stakeholder_email,
      nit: billData?.stakeholder_nit,
      phone: billData?.stakeholder_phone,
    }
    const UserName = Cache.getItem('currentSession')
    const invoiceIntems = {
      items: itemListData.flatMap(p => {
        return {
          ...p,
          payment_amount: Number(p.payment_amount.replace(/,/g, '')),
          payment_qty: Number(p.payment_qty.replace(/,/g, '')),
        }
      }),
      fechaEmisionDocumentoOrigen: formatGuatemalaDate(
        billData?.created_at,
        'YYYY-MM-DD'
      ),
      motivoAjuste: reasonAdjust,
      numeroAutorizacionDocumentoOrigen: billData?.uuid,
      numeroDocumentoOrigen: billData?.document_number,
      serieDocumentoOrigen: billData?.serie,
      created_by: UserName ? UserName.userName : 'system',
      documentType: creditOrDebit,
    }
    let requestObject = { client: clientObj, invoice: invoiceIntems }

    console.log('request Object ', requestObject)

    let infileDoc = await billingSrc.createDebitCreditNote(requestObject)
    let infileMessage = infileDoc.message

    if (infileMessage === 'SUCCESSFUL') {
      message.success('Creado exitosamente')
      setShowModal(false)
      clearAll()
      loadData()
    } else {
      let messageError = 'No se ha podido crear el documento'

      if (infileDoc.data.descripcion_errores.length > 0) {
        messageError = infileDoc.data.descripcion_errores
          .map(error => error.mensaje_error.split('Error -')[1])
          .join(' - ')

        if (messageError.length === 0) {
          messageError = 'No se ha podido crear el documento'
        }
      }
      message.error(messageError, 5)
      setShowModal(false)
      clearAll()
      loadData()
    }
  }

  const validateObject = objeto => {
    return Object.values(objeto).some(valor => {
      return valor === undefined || valor === null || valor === '' || valor <= 0
    })
  }

  //Fact fel
  const getFelReportParams = (
    page = paginationFel.current,
    pageSize = paginationFel.pageSize,
    withPagination = true
  ) => ({
    related_internal_document_id: {
      $like: `%25${filtersFel.related_internal_document_id || ''}%25`,
    },
    id: { $like: `%25${filtersFel.id || ''}%25` },
    name: { $like: `%25${filtersFel.name || ''}%25` },
    document_number: { $like: `%25${filtersFel.document_number || ''}%25` },
    nit: { $like: `%25${filtersFel.nit || ''}%25` },
    ...getSingleDateFilter(filtersFel.created_at),
    total_amount: { $like: `%25${filtersFel.totalInvoice || ''}%25` },
    ...(withPagination
      ? {
          $limit: pageSize,
          $offset: (page - 1) * pageSize,
        }
      : {}),
  })

  const getBillData = useCallback(() => {
    if (!showModal || showBillForm) return

    setLoadingBill(true)
    billingSrc
      .getInvoices(getFelReportParams())
      .then(data => {
        setDataSourceFel(data.items || data)
        setPaginationFel(prevState => ({
          ...prevState,
          total: data.pagination?.total || 0,
        }))
      })
      .catch(_ => message.error('Error al cargar facturas'))
      .finally(() => setLoadingBill(false))
  }, [
    showModal,
    showBillForm,
    filtersFel,
    paginationFel.current,
    paginationFel.pageSize,
  ])

  useEffect(() => {
    getBillData()
  }, [getBillData])

  const setSearchFiltersFel = field => value => {
    const nextValue =
      field === 'created_at'
        ? value || null
        : value === undefined || value === null
        ? ''
        : value
    setFiltersFel(prevState => ({ ...prevState, [field]: nextValue }))
    setPaginationFel(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFiltersFel = () => {
    setFiltersFel({ ...initFiltersFel.current, created_at: null })
    setPaginationFel(prevState => ({ ...prevState, current: 1 }))
    setFiltersResetKeyFel(prevState => prevState + 1)
  }

  const handlePaginationFelChange = (page, pageSize) => {
    setPaginationFel(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const selectDocument = data => {
    setBillData(data)
    setShowBillForm(true)
    setDisableSubmit(false)
  }

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
      description: '',
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
              onChange={value => setCreditOrDebit(value)}
              value={creditOrDebit}
            >
              <Option key={'NCRE'} value={'NCRE'}>
                <span>Nota de Credito</span>
              </Option>
              <Option key={'NDEB'} value={'NDEB'}>
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
    window.open(urlDocument, '_blank').focus()
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
          titleButton={'Crear'}
          title={'Nota de Debito / Credito'}
          showDrawer={newBillAction}
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
        <BillingManagementTable
          dataSource={dataSource}
          summary={summary}
          filters={filters}
          filtersResetKey={filtersResetKey}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          handlerPrintDocument={handlerPrintDocument}
        />
      </div>
      <Modal
        width={1800}
        centered
        title='Nueva Nota de Credito/Debito'
        visible={showModal}
        onOk={() => submitInfo()}
        onCancel={() => hideBillAction()}
        okButtonProps={{ disabled: disableSubmit }}
        bodyStyle={{
          minHeight: '80vh',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Spin
          spinning={loadingSpining}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {showBillForm ? (
            billFormComponent()
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(80vh - 140px)',
                minHeight: 480,
              }}
            >
              <BillingManagementFelTable
                  dataSource={dataSourceFel}
                  filters={filtersFel}
                  filtersResetKey={filtersResetKeyFel}
                  handleFiltersChange={setSearchFiltersFel}
                  onClearFilters={clearFiltersFel}
                  handlerShowDocument={selectDocument}
                  loading={loadingBill}
                  pagination={paginationFel}
                  onPaginationChange={handlePaginationFelChange}
                />
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  )
}
export default BillingManagementIndex
