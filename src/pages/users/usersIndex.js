//libraries
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import { withRouter } from 'react-router'
import { message } from 'antd'
import UsersSrc from './usersSrc'
//components
import UserTable from '../users/components/userTable'
import HeaderPage from '../../components/HeaderPage'
import UserDrawer from './components/userDrawer'
import UserPermissions from './components/userPermissions'
import { showErrors } from '../../utils'
import { permissions } from '../../commons/types'

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

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}

function Users(props) {
  const pageRef = useRef(null)
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      fullName: '',
    }
  }

  const [pageHeight, setPageHeight] = useState(null)
  const [dataSource, setDataSource] = useState([])
  const [dataPermissions, setDataPermissions] = useState([])
  const [visible, setVisible] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [editDataDrawer, setEditDataDrawer] = useState(null)
  const [filters, setFilters] = useState(initFilters.current)
  const [filtersResetKey, setFiltersResetKey] = useState(0)
  const [pagination, setPagination] = useState(defaultPagination)

  const getUsersParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    ...(filters.fullName
      ? { full_name: { $like: `%25${filters.fullName}%25` } }
      : {}),
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const loadData = useCallback(() => {
    setLoading(true)
    UsersSrc.getUsers(getUsersParams())
      .then(result => {
        setDataSource(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(err => {
        console.log('ERROR GET USERS', err)
        message.error('No se pudo obtener la informacion.')
      })
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

  const setSearchFilters = field => value => {
    setFilters(prevState => ({ ...prevState, [field]: value ?? '' }))
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const clearFilters = () => {
    setFilters({ ...initFilters.current })
    setPagination(prevState => ({ ...prevState, current: 1 }))
    setFiltersResetKey(prevState => prevState + 1)
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const EditRow = data => {
    setEditMode(true)
    setVisible(true)
    setEditDataDrawer(data)
  }

  const showDrawer = () => {
    props.history.push('/userView')
  }

  const onClose = () => {
    setVisible(false)
  }

  const onCancelButton = () => {
    setVisible(false)
  }

  const DeleteRow = async data => {
    try {
      setLoading(true)

      UsersSrc.deleteUser({ id: data.id })
        .then(_ => {
          message.success('Usuario eliminado')
          loadData()
        })
        .catch(err => {
          setLoading(false)
          console.log('ERROR ON DELETE USER:', err)
          message.warning('No se ha podido borrar el usuario')
        })
    } catch (e) {
      setLoading(false)
      console.log('ERROR ON DELETE USER.', e.message)
      showErrors(e)
    }
  }

  const editPermissions = data => {
    setUserId(data.id)
    setDataPermissions(data)
    setShowPermissions(true)
  }

  const saveInformation = async data => {
    try {
      setLoading(true)
      delete data.password
      UsersSrc.updateUser(data)
        .then(_ => {
          message.success('Informacion actualizada')
          loadData()
          setVisible(false)
          setShowPermissions(false)
        })
        .catch(err => {
          console.log('ERROR ON UPDATE PERMISSIONS', err)
          message.warning('No se ha podido actualizar la informacion')
          setLoading(false)
        })
    } catch (e) {
      console.log('ERROR ON EDIT USER INFORMATION.', e)
      showErrors(e)
      setLoading(false)
    }
  }

  const closeUserPermissions = () => {
    setShowPermissions(false)
    loadData()
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
          titleButton={'Nuevo usuario'}
          title={'Usuarios'}
          showDrawer={showDrawer}
          permissions={permissions.USUARIOS}
        />
      </div>
      <div style={contentStyle}>
        <UserTable
          dataSource={dataSource}
          loading={loading}
          filters={filters}
          filtersResetKey={filtersResetKey}
          pagination={pagination}
          handleFiltersChange={setSearchFilters}
          onClearFilters={clearFilters}
          onPaginationChange={handlePaginationChange}
          handlerEditRow={EditRow}
          handlerDeleteRow={DeleteRow}
          handlerEditPermissions={editPermissions}
        />
      </div>

      <UserDrawer
        closable={onClose}
        visible={visible}
        edit={editMode}
        editData={editDataDrawer}
        cancelButton={onCancelButton}
        saveButtonEdit={saveInformation}
      />
      <UserPermissions
        closable={() => setShowPermissions(false)}
        closeOnSave={closeUserPermissions}
        visible={showPermissions}
        userId={userId}
        permissionsData={dataPermissions}
      />
    </div>
  )
}
export default withRouter(Users)
