import api from '../../commons/api'
import { stage } from '../../commons/credentials'
import { stakeholdersTypes } from '../../commons/types'

const urlProduct = stage.productUrl
const urlInvoice = stage.invoiceUrl
const urlInvoiceFel = stage.invoiceFelUrl
const urlStakeholder = stage.stakeholderUrl

const getInvoices = params => api.get(urlInvoice, { ...params })
const getPaymentMethods = () => api.get(`${urlInvoice}/payment-methods`)
const getServiceTypes = () => api.get(`${urlInvoice}/service-types`)
const getCreditDays = () => api.get(`${urlInvoice}/credit-days`)
const createInvoice = data => api.post(urlInvoice, data)
const createInvoiceDraft = data => api.post(`${urlInvoice}/draft`, data)
const certifyInvoiceDraft = documentId =>
  api.post(`${urlInvoice}/${documentId}/certify`, {})
const updateInvoice = data => api.put(urlInvoice, data)
const cancelInvoice = data => api.put(`${urlInvoice}/cancel`, data)
//fel
//const createInvoiceFel = data => api.post(`${urlInvoiceFel}/create`, data)
const createInvoiceFel = data => api.post(`${urlInvoiceFel}/createFactCam`, data)
const getInvoiceFel = id => api.get(`${urlInvoiceFel}/getDocument?id=${id}`)
const cancelInvoiceFel = data => api.post(`${urlInvoiceFel}/cancelDocument`, data)

const getProductsOptions = params =>
  api.get(`${urlProduct}-options`, { ...params })
const getStakeholdersOptions = params =>
  api.get(`${urlStakeholder}-options`, {
    ...params,
    stakeholder_type: { $ne: stakeholdersTypes.PROVIDER },
  })
const getProjectsOptions = params => api.get(`${urlStakeholder}/projects-options`, params)
const getStakeholderTypes = () => api.get(`${urlStakeholder}/types`)
const getCreditStatusOptions = () => api.get(`${urlInvoice}/credit-status`)

const createDebitCreditNote = data => api.post(`${urlInvoiceFel}/createDebitCreditNote`, data)

const getDebitCreditNotesData = params => api.get(`${urlInvoiceFel}/getDocumentDebitCreditNote`, { ...params })

const InventorySrc = {
  getCreditDays,
  getCreditStatusOptions,
  getInvoices,
  getPaymentMethods,
  createInvoice,
  createInvoiceDraft,
  certifyInvoiceDraft,
  updateInvoice,
  cancelInvoice,
  getProductsOptions,
  getProjectsOptions,
  getServiceTypes,
  getStakeholdersOptions,
  getStakeholderTypes,
  createInvoiceFel,
  getInvoiceFel,
  cancelInvoiceFel,
  createDebitCreditNote,
  getDebitCreditNotesData
}

export default InventorySrc
