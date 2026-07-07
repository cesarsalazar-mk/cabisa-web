import api from '../../commons/api'
import { stage } from '../../commons/credentials'

const urlUser = stage.usersUrl

const getUsers = params => api.get(urlUser, params)
const getUsersPermissions = email => api.get(urlUser, { email })
const createUser = _users => api.post(urlUser, _users)
const updateUser = _users => api.put(urlUser, _users)
const updatePermissions = _users => api.put(`${urlUser}/permissions`, _users)
const deleteUser = _users => api.remove(urlUser, _users)
const getUsersByName = params => api.get(urlUser, params)
const getRoles = params => api.get(`${urlUser}/roles`, params)

const UsersSrc = {
  getUsersByName,
  getUsers,
  createUser,
  updatePermissions,
  updateUser,
  deleteUser,
  getUsersPermissions,
  getRoles,
}

export default UsersSrc
