import api from '../../commons/api'
import { stage } from '../../commons/credentials'
import { stakeholdersTypes, stakeholdersStatus } from '../../commons/types'

const url = stage.stakeholderUrl

const getClients = params =>
  api.get(url, {
    stakeholder_type: { $ne: stakeholdersTypes.PROVIDER },
    status: stakeholdersStatus.ACTIVE,
    ...params,
  })
const createClient = _users => api.post(url, _users)
const updateClient = _users => api.put(url, _users)
const deleteClient = id =>
  api.put(`${url}/status`, { id, status: stakeholdersStatus.INACTIVE })
const getClientTypes = () => api.get(`${url}/types`)

const ClientsSrc = {
  getClients,
  getClientTypes,
  createClient,
  updateClient,
  deleteClient,
}

export default ClientsSrc
