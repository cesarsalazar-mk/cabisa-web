import React from 'react'
import DocumentTotalCell from '../../../components/DocumentTotalCell'

function BillingTotalCell({ record }) {
  return <DocumentTotalCell record={record} totalField='total' />
}

export default BillingTotalCell
