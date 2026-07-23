import React, { useEffect, useState } from 'react'
import moment from 'moment'
import {
  Col,
  Divider,
  Input,
  Row,
  Select,
  Typography,
  Button,
  Popconfirm,
  DatePicker,
  message,
} from 'antd'
import FooterButtons from '../../../components/FooterButtons'
import DynamicTable from '../../../components/DynamicTable'
import Tag from '../../../components/Tag'
import CurrencyInput from '../../../components/CurrencyInput'
import { useEditableList } from '../../../hooks'
import {
  validateEmail,
  showErrors,
  validateRole,
  formatPhone,
  formatPhoneOnChange,
  numberFormat,
  formatGuatemalaDate,
} from '../../../utils'
import { stakeholdersTypes, roles } from '../../../commons/types'
import ClientsSrc from '../clientsSrc'

const { Title } = Typography
const { Option } = Select
const { getValue, getFormattedValue } = numberFormat()

const getProjectColumns = ({
  handleRemoveProject,
  handleChangeProject,
  isAdmin,
}) => {
  const columns = [
    {
      width: 180,
      title: 'Fecha de registro',
      dataIndex: 'created_at', // Field that is goint to be rendered
      key: 'created_at',
      render: text => (
        <div>{formatGuatemalaDate(text) || null}</div>
      ),
    },
    {
      width: 180,
      title: 'Fecha inicial',
      dataIndex: 'start_date', // Field that is goint to be rendered
      key: 'start_date',
      render: (_, record, rowIndex) => (
        <DatePicker
          style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          placeholder='Fecha inicial'
          format='DD-MM-YYYY'
          value={record.start_date ? moment(record.start_date) : ''}
          onChange={value => handleChangeProject('start_date', value, rowIndex)}
          disabled={!isAdmin}
        />
      ),
    },
    {
      width: 180,
      title: 'Fecha final',
      dataIndex: 'end_date', // Field that is goint to be rendered
      key: 'end_date',
      render: (_, record, rowIndex) => (
        <DatePicker
          style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          placeholder='Fecha final'
          format='DD-MM-YYYY'
          value={record.end_date ? moment(record.end_date) : ''}
          onChange={value => handleChangeProject('end_date', value, rowIndex)}
          disabled={!isAdmin}
        />
      ),
    },
    {
      title: 'Proyecto',
      dataIndex: 'name', // Field that is goint to be rendered
      key: 'name',
      render: (_, record, rowIndex) => (
        <Input
          value={record.name}
          size={'large'}
          placeholder={'Nombre del Proyecto'}
          style={{ minWidth: '120px' }}
          onChange={e => handleChangeProject('name', e.target.value, rowIndex)}
          disabled={!isAdmin}
        />
      ),
    },
  ]

  const deleteColumn = {
    title: '',
    dataIndex: 'id',
    render: (_, __, rowIndex) => (
      <Popconfirm
        title='¿Esta seguro de eliminar?'
        onConfirm={() => handleRemoveProject(rowIndex)}
      >
        <span style={{ color: 'red' }}>Eliminar</span>
      </Popconfirm>
    ),
  }

  return isAdmin ? [...columns, deleteColumn] : columns
}

function ClientFields({ edit, editData, ...props }) {
  const [name, setName] = useState('')
  const [clientTypeID, setClientTypeID] = useState(null)
  const [nit, setNit] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState(null)
  const [address, setAddress] = useState('')
  const [payments_man, setPayments_man] = useState('')
  const [business_man, setBusiness_man] = useState('')
  const [creditLimit, setCreditLimit] = useState(null)
  const [projectsData, setProjectsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [
    stakeholderTypesOptionsList,
    setStakeholderTypesOptionsList,
  ] = useState([])

  const isAdmin = validateRole(roles.ADMIN)

  useEffect(() => {
    setLoading(true)

    ClientsSrc.getClientTypes()
      .then(data => {
        const stakeholdersTypesList = data.filter(
          s => s !== stakeholdersTypes.PROVIDER
        )

        setStakeholderTypesOptionsList(stakeholdersTypesList)
      })
      .catch(_ => message.error('Error al cargar tipos de cliente'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setName(edit ? editData.name : '')
    setClientTypeID(edit ? editData.stakeholder_type : null)
    setNit(edit ? editData.nit : '')
    setEmail(edit ? editData.email : '')
    setPhone(edit ? formatPhone(editData.phone) : '')
    setAddress(edit ? editData.address : '')
    setBusiness_man(edit ? editData.business_man : '')
    setPayments_man(edit ? editData.payments_man : '')
    setCreditLimit(
      edit ? getFormattedValue(getValue(editData.credit_limit)) || null : null
    )
    setProjectsData(
      edit ? editData.projects : projectsData.length > 0 ? projectsData : []
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visible])

  const {
    handleAdd: handleAddProject,
    handleRemove: handleRemoveProject,
    handleChange: handleChangeProject,
  } = useEditableList({
    state: projectsData,
    setState: setProjectsData,
    initRow: {
      id: '',
      created_at: new Date().toISOString(),
      start_date: '',
      end_date: '',
      name: '',
    },
    includeInitRow: false,
    minimumLength: 0,
  })

  const getSaveData = () => ({
    id: editData?.id,
    name,
    stakeholder_type: clientTypeID,
    nit,
    email,
    phone: phone
      .split('')
      .flatMap(c => (c === '-' ? '' : c))
      .join(''),
    address,
    business_man,
    credit_limit: getValue(creditLimit) || null,
    payments_man,
    projects: projectsData.map(p => ({
      id: p.id,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
      start_date: p.start_date ? new Date(p.start_date).toISOString() : null,
      end_date: p.end_date ? new Date(p.end_date).toISOString() : null,
      name: p.name,
    })),
  })

  const validateSaveData = data => {
    const errors = []
    const requiredFields = [
      { key: 'name', value: 'Nombre o Razon Social' },
      { key: 'stakeholder_type', value: 'Tipo de Cliente' },
      { key: 'nit', value: 'NIT' },
      { key: 'phone', value: 'Telefono' },
      { key: 'address', value: 'Direccion' },
    ]
    const requiredErrors = requiredFields.flatMap(field =>
      !data[field.key] ? field.value : []
    )
    if (requiredErrors.length > 0) {
      requiredErrors.forEach(k => {
        errors.push(`El campo ${k} es obligatorio`)
      })
    }
    const projectsRequiredFields = ['start_date', 'name']

    const projectRequiredPositions = data.projects.flatMap((p, i) =>
      projectsRequiredFields.some(k => !p[k]) ? i + 1 : []
    )
    if (data?.projects?.length > 0 && projectRequiredPositions.length > 0) {
      projectRequiredPositions.forEach(p => {
        errors.push(
          `Los campos Proyecto y Fecha inicial del proyecto ${p} son obligatorios`
        )
      })
    }

    if (!validateEmail(email)) errors.push('Ingrese un email valido')

    return {
      isInvalid: errors.length > 0,
      error: {
        message: errors,
      },
    }
  }

  const saveData = () => {
    const saveData = getSaveData()

    const { isInvalid, error } = validateSaveData(saveData)

    if (isInvalid) return showErrors(error)

    props.saveUserData(saveData)
  }

  const projectsColumns = getProjectColumns({
    handleRemoveProject,
    handleChangeProject,
    isAdmin,
  })

  const handleChangePhone = e => {
    const rawValue = e?.target?.value !== undefined ? e.target.value : e
    const value = formatPhoneOnChange(phone, rawValue)
    setPhone(value)
  }

  return (
    <>
      <div>
        {edit && (
          <>
            <Title>{edit ? 'Editar Cliente' : 'Nuevo Cliente'}</Title>
            <Divider className={'divider-custom-margins-users'} />
          </>
        )}

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={12} sm={12} md={12} lg={12}>
            <div className={'title-space-field'}>Nombre o Razón social</div>
            <Input
              value={name}
              placeholder={'Nombre'}
              size={'large'}
              onChange={value => setName(value.target.value)}
              disabled={!isAdmin}
            />
          </Col>
          <Col xs={12} sm={12} md={12} lg={12}>
            <div className={'title-space-field'}>Tipo de cliente</div>
            <Select
              value={clientTypeID}
              className={'single-select'}
              placeholder={'Elegir tipo'}
              size={'large'}
              style={{ width: '100%' }}
              onChange={value => setClientTypeID(value)}
              getPopupContainer={trigger => trigger.parentNode}
              disabled={!isAdmin}
              loading={loading}
            >
              {stakeholderTypesOptionsList?.length > 0 ? (
                stakeholderTypesOptionsList.map(value => (
                  <Option key={value} value={value}>
                    <Tag type='stakeholderTypes' value={value} />
                  </Option>
                ))
              ) : (
                <Option value={editData?.stakeholder_type}>
                  <Tag
                    type='stakeholderTypes'
                    value={editData?.stakeholder_type}
                  />
                </Option>
              )}
            </Select>
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={6} sm={6} md={6} lg={6}>
            <div className={'title-space-field'}>NIT</div>
            <Input
              value={nit}
              placeholder={'Escribir NIT'}
              size={'large'}
              onChange={value => setNit(value.target.value)}
              disabled={!isAdmin}
            />
          </Col>
          <Col xs={12} sm={12} md={12} lg={12}>
            <div className={'title-space-field'}>Email</div>
            <Input
              value={email}
              placeholder={'Escribir email'}
              size={'large'}
              type={'email'}
              onChange={value => setEmail(value.target.value)}
              disabled={!isAdmin}
            />
          </Col>
          <Col xs={6} sm={6} md={6} lg={6}>
            <div className={'title-space-field'}>Telefono</div>
            <Input
              value={phone}
              placeholder={'Escribir telefono'}
              size={'large'}
              onChange={handleChangePhone}
              disabled={!isAdmin}
            />
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={18} sm={18} md={18} lg={18}>
            <div className={'title-space-field'}>Direccion</div>
            <Input
              value={address}
              placeholder={'Escribir direccion'}
              size={'large'}
              onChange={value => setAddress(value.target.value)}
              disabled={!isAdmin}
            />
          </Col>
          <Col xs={6} sm={6} md={6} lg={6}>
            <div className={'title-space-field'}>Limite de credito (Q)</div>
            <CurrencyInput
              value={creditLimit}
              placeholder={'Limite de credito (Q)'}
              onChange={value => setCreditLimit(value)}
              disabled={!isAdmin}
            />
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={12} sm={8} md={12} lg={12}>
            <div className={'title-space-field'}>Encargado Compras</div>
            <Input
              value={business_man}
              size={'large'}
              placeholder={'Encargado Compras'}
              onChange={val => setBusiness_man(val.target.value)}
              disabled={!isAdmin}
            />
          </Col>
          <Col xs={12} sm={12} md={12} lg={12}>
            <div className={'title-space-field'}>Encargado Pagos</div>
            <Input
              value={payments_man}
              size={'large'}
              placeholder={'Encargado Pagos'}
              onChange={val => setPayments_man(val.target.value)}
              disabled={!isAdmin}
            />
          </Col>
        </Row>

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={24} sm={24} md={24} lg={24}>
            <DynamicTable columns={projectsColumns} data={projectsData} />
          </Col>
        </Row>

        {isAdmin && (
          <Row gutter={16} className={'section-space-list'}>
            <Col xs={24} sm={24} md={24} lg={24}>
              <Button
                type='dashed'
                className={'shop-add-turn'}
                onClick={handleAddProject}
              >
                Agregar Proyecto
              </Button>
            </Col>
          </Row>
        )}
      </div>
      {isAdmin && (
        <FooterButtons
          saveData={saveData}
          cancelButton={props.cancelButton}
          edit={edit}
          cancelLink='/clients'
        />
      )}
    </>
  )
}
export default ClientFields
