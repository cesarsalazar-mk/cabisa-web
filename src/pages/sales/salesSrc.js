import api from '../../commons/api'
import { stage } from '../../commons/credentials'

const urlSale = stage.saleUrl
const urlProduct = stage.productUrl
const urlStakeholder = stage.stakeholderUrl
const urlInvoice = stage.invoiceUrl

const urlServiceOrders = stage.reportUrl

const getProjectsOptions = params =>
  api.get(`${urlStakeholder}/projects-options`, params)
const getProductsOptions = params =>
  api.get(`${urlProduct}-options`, { ...params })
const getStakeholdersOptions = params =>
  api.get(`${urlStakeholder}-options`, { ...params })
const getServiceTypes = () => api.get(`${urlInvoice}/service-types`)
const getSales = params => api.get(urlSale, { ...params })
const getSalesStatus = () => api.get(`${urlSale}-status`)
const approveSale = data => api.post(`${urlSale}/invoice`, data)
const certifySale = (documentId, data) => api.post(`${urlSale}/${documentId}/certify`, data)
const createSale = data => api.post(urlSale, data)
const cancelSale = data => api.put(`${urlSale}/cancel`, data)
const updateSale = data => api.put(urlSale, data)
//report
const getServiceOrders = params => api.get(`${urlServiceOrders}/getServiceOrders`, { ...params })

const InventorySrc = {
  getProjectsOptions,
  getProductsOptions,
  getServiceTypes,
  getStakeholdersOptions,
  getSales,
  getSalesStatus,
  approveSale,
  certifySale,
  createSale,
  cancelSale,
  updateSale,
  getServiceOrders
}

export default InventorySrc
