import React, { useEffect, useState, useRef, useCallback } from 'react'
import { message } from 'antd'
import moment from 'moment'
import GenericTable from '../../../components/genericTable'
import ReportAccountsReceivableFilters from './components/reportAccountsReceivableFilters'
import HeaderPage from '../../../components/HeaderPage'
import Tag from '../../../components/Tag'
import DocumentTotalCell from '../../../components/DocumentTotalCell'
import ReportsSrc from '../reportsSrc'
import { showErrors } from '../../../utils'
import { stakeholdersTypes } from '../../../commons/types'

const columns = [
  {
    title: 'Cliente',

    dataIndex: 'stakeholder_name', // Field that is goint to be rendered
    key: 'stakeholder_name',
    render: text => <span>{text}</span>,
  },
  {
    title: 'Monto a Pagar',
    dataIndex: 'total_amount',
    key: 'total_amount',
    align: 'center',
    render: (_, record) => (
      <DocumentTotalCell
        record={record}
        totalField='total_amount'
        showBillManagementLink={Boolean(record.document_number)}
      />
    ),
  },
  {
    title: 'Total Pendiente',
    dataIndex: 'unpaid_credit_amount',
    key: 'unpaid_credit_amount',
    align: 'center',
    render: text =>
      text || text === 0 ? <span>{Number(text).toFixed(2)}</span> : null,
  },
  {
    title: 'Fecha de facturacion',
    dataIndex: 'document_date', // Field that is goint to be rendered
    key: 'document_date',
    render: text =>
      text ? <span>{moment(text).format('DD-MM-YYYY')}</span> : null,
  },
  {
    title: 'Fecha a pagar',
    dataIndex: 'credit_due_date', // Field that is goint to be rendered
    key: 'credit_due_date',
    render: text =>
      text ? <span>{moment(text).format('DD-MM-YYYY')}</span> : null,
  },
  {
    title: 'Fecha pago realizado',
    dataIndex: 'credit_paid_date', // Field that is goint to be rendered
    key: 'credit_paid_date',
    render: text =>
      text ? <span>{moment(text).format('DD-MM-YYYY')}</span> : null,
  },
  {
    title: 'Situacion',
    dataIndex: 'credit_status', // Field that is goint to be rendered
    key: 'credit_status',
    render: text => <Tag type='creditStatus' value={text} />,
  },
  {
    title: 'Observacion',
    dataIndex: 'id', // Field that is goint to be rendered
    key: 'id',
    render: (_, row) => (
      <span>{row.description ? row.description : row.comments}</span>
    ),
  },
]

function ReportAccountsReceivable() {
  const initFilters = useRef()

  if (!initFilters.current) {
    initFilters.current = {
      stakeholder_name: '',
      credit_status: '',
      stakeholder_type: '',
      created_at: '',
      credit_due_date: '',
      credit_paid_date: '',
    }
  }

  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initFilters.current)
  const [dataSource, setDataSource] = useState([])
  const [creditStatusOptionsList, setCreditStatusOptionsList] = useState([])
  const [
    stakeholderTypesOptionsList,
    setStakeholderTypesOptionsList,
  ] = useState([])

  const fetchAccountsReceivable = useCallback(() => {
    setLoading(true)

    ReportsSrc.getAccountsReceivable({
      stakeholder_name: { $like: `%25${filters.stakeholder_name}%25` },
      credit_status: filters.credit_status,
      stakeholder_type: filters.stakeholder_type,
      created_at: filters.created_at
        ? { $like: `${moment(filters.created_at).format('YYYY-MM-DD')}%25` }
        : '',
      credit_due_date: filters.credit_due_date
        ? {
            $like: `${moment(filters.credit_due_date).format('YYYY-MM-DD')}%25`,
          }
        : '',
      credit_paid_date: filters.credit_paid_date
        ? {
            $like: `${moment(filters.credit_paid_date).format(
              'YYYY-MM-DD'
            )}%25`,
          }
        : '',
    })
      .then(result => setDataSource(result))
      .catch(error => showErrors(error))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    fetchAccountsReceivable()
  }, [fetchAccountsReceivable])

  useEffect(() => {
    setLoading(true)

    Promise.all([
      ReportsSrc.getCreditStatusOptions(),
      ReportsSrc.getStakeholderTypes(),
    ])
      .then(data => {
        const stakeholdersTypesList = data[1].filter(
          s => s !== stakeholdersTypes.PROVIDER
        )

        setCreditStatusOptionsList(data[0])
        setStakeholderTypesOptionsList(stakeholdersTypesList)
      })
      .catch(_ => message.error('Error al cargar listados'))
      .finally(() => setLoading(false))
  }, [])

  const setSearchFilters = field => value =>
    setFilters(prevState => ({ ...prevState, [field]: value }))

  return (
    <>
      <HeaderPage title={'Reporte - Cuentas por cobrar'} />
      <ReportAccountsReceivableFilters
        filters={filters}
        setSearchFilters={setSearchFilters}
        creditStatusOptionsList={creditStatusOptionsList}
        stakeholderTypesOptionsList={stakeholderTypesOptionsList}
      />
      <GenericTable data={dataSource} loading={loading} columns={columns} />
    </>
  )
}

export default ReportAccountsReceivable
