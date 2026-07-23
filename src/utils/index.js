import moment from 'moment'
import { message } from 'antd'
import { Cache } from 'aws-amplify'
import { RESTRICTED_REPORT_CARD_ALLOWED_USERS } from '../commons/restrictedReportUsers'

export const roundNumber = input => {
  const num = Number(input)

  if (!input || isNaN(num)) return input

  return Math.round((num + Number.EPSILON) * 100) / 100
}

export const formatNumber = number => {
  if (number === 0) return number
  let num1 = number?.split('.')[0]
  let num2 = number?.split('.')[1]?.slice(0, 2) || '00'
  num1 = num1
    .toString()
    .split('')
    .reverse()
    .join('')
    .replace(/(?=\d*\.?)(\d{3})/g, '$1,')
  num1 = num1.split('').reverse().join('').replace(/^[.]/, '')
  let num = `${num1}.${num2}`
  return num
}

export const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export const validateRole = rolId => {
  const currentSessionRoleId = Cache.getItem('currentSession').rol_id
  return currentSessionRoleId <= rolId
}

export const validatePermissions = permissionId => {  
  const currentSessionPermissions = Cache.getItem('currentSession').userPermissions  
  const currentPermission = currentSessionPermissions.find(
    p => Number(p.id) === Number(permissionId)
  )    
  return action => currentPermission && currentPermission[action]
}

const normalizeUserIdentifier = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')

const getSessionUserIdentifiers = session => {
  const identifiers = new Set()

  ;[session.cognitoUsername, session.userName].forEach(value => {
    if (value) identifiers.add(normalizeUserIdentifier(value))
  })

  if (session.email) {
    const email = String(session.email).trim().toLowerCase()
    identifiers.add(normalizeUserIdentifier(email))

    const localPart = email.split('@')[0]
    const plusAlias = localPart.includes('+') ? localPart.split('+').pop() : null

    if (plusAlias) identifiers.add(normalizeUserIdentifier(plusAlias))
  }

  return identifiers
}

export const canViewRestrictedReportCards = () => {
  const session = Cache.getItem('currentSession')
  if (!session) return false

  const identifiers = getSessionUserIdentifiers(session)

  return RESTRICTED_REPORT_CARD_ALLOWED_USERS.some(allowedUser =>
    identifiers.has(normalizeUserIdentifier(allowedUser))
  )
}

const getErrorData = error => {
  if (error?.response?.data?.error?.errors)
    return error.response.data.error.errors

  if (error?.response?.data?.error) return error.response.data.error

  if (error.message) return error.message

  if (error && !error.response) return 'Network Error'

  return 'Unknown Error'
}

export const getPercent = number => {
  const tax_fee = Number(number)
  return !isNaN(tax_fee) && tax_fee > 0 ? tax_fee / 100 : 0
}

export const showErrors = error => {
  const data = getErrorData(error)
  const messages = typeof data === 'string' ? [data] : data

  messages.forEach(msg => message.error(msg))
}

export const catchingErrors = errorCode => {
  switch (true) {
    case errorCode.indexOf('UsernameExistsException') > -1:
      return 'El nombre de usuario ya existe.'
    case errorCode.indexOf('InvalidPasswordException') > -1:
      return 'La contraseña debe tener letras minusculas,mayusculas y un caracter especial.'
    case errorCode.indexOf('The provided email is already registered') > -1:
      return 'El correo electrónico proporcionado ya está registrado.'
    case errorCode.indexOf('User is disabled.') > -1:
      return 'Usuario deshabilitado, contacta al administrador.'
    case errorCode.indexOf('UserMigration failed') > -1:
      return 'Usuario/Password incorrectos.'
    case errorCode.indexOf('Incorrect') > -1:
      return 'Usuario/Password incorrectos'
    case errorCode.indexOf('User does not exist.') > -1:
      return 'El usuario aun no esta confirmado.'
    case errorCode.indexOf('is not registered') > -1:
      return 'El Cliente no esta registrado'
    case errorCode.indexOf('Attempt limit exceeded') > -1:
      return 'Se ha excedido el numero de intentos, espera un momento y vuelve a intentarlo.'
    default:
      return 'Error al procesar la información.'
  }
}

export const getBase64 = (img, callback) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result))
  reader.readAsDataURL(img)
}

export const isEmptyObject = obj => {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false
    }
  }

  return JSON.stringify(obj) === JSON.stringify({})
}

export const formatPhoneOnChange = (prevValue, nextValue) => {
  if ((!nextValue && nextValue !== '') || nextValue.length > 9) return prevValue

  return nextValue
    .split('')
    .map((v, i) =>
      i === 4 && nextValue.length < 6 && nextValue.length > prevValue?.length
        ? `-${v}`
        : v
    )
    .join('')
}

export const formatPhone = value => {
  if (!value || value.length > 8) return value

  return value
    .split('')
    .map((v, i) => (i === 4 ? `-${v}` : v))
    .join('')
}

export const toRegExp = val => {
  const escaped = val.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  return new RegExp(escaped, 'g')
}

export const numberFormat = ({
  currencyFormat = 'en-US',
  fractionDigits = 2,
} = {}) => {
  // currencyFormat = 'de-DE' usa punto para miles y coma para decimales
  // currencyFormat = 'en-US' usa coma para miles y punto para decimales
  const fractionSeparator = currencyFormat === 'de-DE' ? ',' : '.'
  const groupSeparator = currencyFormat === 'de-DE' ? '.' : ','

  return {
    fractionSeparator,

    groupSeparator,

    getFormattedValue: value => {
      if (!value || isNaN(Number(value))) return value

      return new Intl.NumberFormat(currencyFormat, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(value)
    },

    getValue: formattedValue => {
      if (!formattedValue || typeof formattedValue === 'number')
        return formattedValue || 0

      const result = String(formattedValue)
        .replace(toRegExp(groupSeparator), '')
        .replace(fractionSeparator, '.')

      return Number(result)
    },
  }
}

export const GUATEMALA_UTC_OFFSET_HOURS = 6
export const GUATEMALA_UTC_OFFSET_MINUTES = GUATEMALA_UTC_OFFSET_HOURS * 60

const STORED_DATETIME_FORMATS = [
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss',
  moment.ISO_8601,
]

const parseStoredUtcDate = value => {
  if (!value) return null

  if (typeof value === 'string' && value.includes('T')) {
    const iso = moment(value)
    return iso.isValid() ? iso.utc() : null
  }

  const utcValue = moment.utc(value, STORED_DATETIME_FORMATS, true)

  return utcValue.isValid() ? utcValue : null
}

export const parseGuatemalaDate = value => {
  const utcValue = parseStoredUtcDate(value)

  if (!utcValue) return null

  return utcValue.clone().utcOffset(-GUATEMALA_UTC_OFFSET_MINUTES)
}

export const formatGuatemalaDate = (value, format = 'DD-MM-YYYY') => {
  if (!value) return ''

  const parsed = parseGuatemalaDate(value)

  return parsed ? parsed.format(format) : ''
}

export const getDateRangeFilter = (
  dateRange,
  { startKey = 'start_date', endKey = 'end_date' } = {}
) => {
  if (!dateRange?.[0] || !dateRange?.[1]) return {}

  return {
    [startKey]: {
      $gte: moment(dateRange[0]).format('YYYY-MM-DD'),
    },
    [endKey]: {
      $lte: moment(dateRange[1]).format('YYYY-MM-DD'),
    },
  }
}

export const getSingleDateFilter = date => {
  if (!date) return {}

  const dateStr = moment(date).format('YYYY-MM-DD')

  return {
    start_date: { $gte: dateStr },
    end_date: { $lte: dateStr },
  }
}

export const formatDateOnly = (value, format = 'DD-MM-YYYY') => {
  if (!value) return ''

  const parsed = moment(
    value,
    ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss.SSS', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601],
    true
  )

  if (parsed.isValid()) {
    return parsed.format(format)
  }

  return formatGuatemalaDate(value, format)
}

export const sortColumnString = (a, b, prop) =>
  (a[prop] ? a[prop].toLowerCase() : a[prop]) < (b[prop] ? b[prop].toLowerCase() : b[prop])
    ? -1
    : (a[prop] ? a[prop].toLowerCase() : a[prop]) > (b[prop] ? b[prop].toLowerCase() : b[prop])
    ? 1
    : 0