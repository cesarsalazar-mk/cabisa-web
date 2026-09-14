import api from '../../commons/api'
import { stage } from '../../commons/credentials'
import { stakeholdersStatus, stakeholdersTypes } from '../../commons/types'

const urlStakeholder = stage.stakeholderUrl
const urlReport = stage.reportUrl
const urlInvoice = stage.invoiceUrl
const urlProduct = stage.productUrl
const urlUser = stage.usersUrl

const getSales = params => api.get(`${urlReport}/sales`, params)
const getInventory = params => api.get(`${urlReport}/inventory`, params)
const getAccountsReceivable = params =>
  api.get(`${urlReport}/accounts-receivable`, params)
const getCreditStatusOptions = () => api.get(`${urlInvoice}/credit-status`)
const getStakeholderTypes = () => api.get(`${urlStakeholder}/types`)
const getPaymentMethods = () => api.get(`${urlInvoice}/payment-methods`)
const getClientsAccountState = params =>
  api.get(`${urlReport}/clients-account-state`, {
    ...params,
    stakeholder_type: params.stakeholder_type
      ? params.stakeholder_type
      : { $ne: stakeholdersTypes.PROVIDER },
    status: stakeholdersStatus.ACTIVE,
  })
const getClientsAccountMovements = params =>
  api.get(`${urlReport}/clients-account-movements`, params)
const getClientsAccountUnpaidInvoices = params =>
  api.get(`${urlReport}/clients-account-unpaid-invoices`, params)
const getClientsAccountInvoices = params =>
  api.get(`${urlReport}/clients-account-invoices`, params)
const getClientTypes = () => api.get(`${urlStakeholder}/types`)
const getProductsCategories = () => api.get(`${urlProduct}-categories`)
const getStakeholdersOptions = params =>
  api.get(`${urlStakeholder}-options`, params)
const getSellersOptions = params => api.get(`${urlUser}-options`, params)

const getDocumentReport = params => api.get(`${urlReport}/getDocumentReport`, { ...params })
const getCashReceipts = params => api.get(`${urlReport}/getCashReceipts`, { ...params })
const getManualCashReceipts = params => api.get(`${urlReport}/getCashManualReceipts`, { ...params })
const exportReport = params => api.get(`${urlReport}/exportReport`, { ...params })

const getServiceOrders = params => api.get(`${urlReport}/getServiceOrders`, { ...params })
const getSalesProductReport = params => api.get(`${urlReport}/getSalesProductReport`, { ...params })

const ReportsSrc = {
  getSales,
  getInventory,
  getAccountsReceivable,
  getClientsAccountState,
  getClientsAccountMovements,
  getClientsAccountUnpaidInvoices,
  getClientsAccountInvoices,
  getClientTypes,
  getCreditStatusOptions,
  getStakeholderTypes,
  getPaymentMethods,
  getProductsCategories,
  getStakeholdersOptions,
  getSellersOptions,
  getDocumentReport,
  exportReport,
  getCashReceipts,
  getManualCashReceipts,
  getServiceOrders,
  getSalesProductReport
}

export default ReportsSrc
