import api from '../../commons/api'
import { stage } from '../../commons/credentials'
import { stakeholdersTypes, stakeholdersStatus } from '../../commons/types'

const url = stage.stakeholderUrl

const getSuppliers = params =>
  api.get(url, {
    stakeholder_type: stakeholdersTypes.PROVIDER,
    status: stakeholdersStatus.ACTIVE,
    ...params,
  })
const createSupplier = _users => api.post(url, _users)
const updateSupplier = _users => api.put(url, _users)
const deleteSupplier = id =>
  api.put(`${url}/status`, { id, status: stakeholdersStatus.INACTIVE })

const SuppliersSrc = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
}

export default SuppliersSrc
