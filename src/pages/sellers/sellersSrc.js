import api from '../../commons/api'
import { stage } from '../../commons/credentials'

const url = stage.sellerUrl

const getSellers = params => api.get(url, params)
const createSeller = data => api.post(url, data)
const updateSeller = data => api.put(url, data)
const deleteSeller = id => api.remove(url, { id })
const reactivateSeller = id => api.put(`${url}/reactivate`, { id })

const SellersSrc = { getSellers, createSeller, updateSeller, deleteSeller, reactivateSeller }

export default SellersSrc
