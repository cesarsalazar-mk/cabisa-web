import React from 'react'
import { Button, Popover, Tag } from 'antd'
import { numberFormat } from '../../../utils'

const { getFormattedValue } = numberFormat()

const NC_COLOR = '#597ef7'
const ND_COLOR = '#fa8c16'

const formatAmount = value =>
  getFormattedValue(Number(value || 0).toFixed(2))

const formatCurrency = value => `Q ${formatAmount(value)}`

const formatSignedCurrency = (value, isCredit) => {
  const sign = isCredit ? '-' : '+'
  return `${sign}Q ${formatAmount(Math.abs(value))}`
}

const getNoteLabel = adjustment => {
  const prefix = adjustment.document_type === 'CREDITO' ? 'NC' : 'ND'
  return `${prefix}-${adjustment.document_number || adjustment.id}`
}

const buildBillManagementUrl = documentNumber => {
  const params = new URLSearchParams({
    related_bill_document_number: documentNumber || '',
  })

  return `/billManagement?${params.toString()}`
}

function BillingTotalCell({ record }) {
  const adjustments = record.adjustments || []
  const hasAdjustments = adjustments.length > 0
  const adjustedTotal = Number(record.adjusted_total ?? record.total ?? 0)
  const originalTotal = Number(record.total || 0)
  const netAdjustment = Number(record.net_adjustment || 0)

  const goToBillManagement = () => {
    window.open(
      buildBillManagementUrl(record.document_number),
      '_blank',
      'noopener,noreferrer'
    )
  }

  const renderBadge = () => {
    if (!hasAdjustments) return null

    if (adjustments.length === 1) {
      const adjustment = adjustments[0]
      const isCredit = adjustment.document_type === 'CREDITO'
      const prefix = isCredit ? 'NC' : 'ND'
      const signedAmount = formatSignedCurrency(adjustment.amount, isCredit)

      return (
        <Tag
          style={{
            marginTop: 4,
            marginRight: 0,
            borderColor: isCredit ? NC_COLOR : ND_COLOR,
            color: isCredit ? NC_COLOR : ND_COLOR,
            background: isCredit ? '#f0f5ff' : '#fff7e6',
          }}
        >
          {prefix} {signedAmount}
        </Tag>
      )
    }

    return (
      <Tag
        style={{
          marginTop: 4,
          marginRight: 0,
          borderColor: '#8c8c8c',
          color: '#595959',
          background: '#fafafa',
          cursor: 'pointer',
        }}
      >
        {adjustments.length} ajustes
      </Tag>
    )
  }

  const popoverContent = (
    <div style={{ minWidth: 260 }}>
      {adjustments.map(adjustment => {
        const isCredit = adjustment.document_type === 'CREDITO'

        return (
          <div
            key={adjustment.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 8,
            }}
          >
            <Tag
              style={{
                margin: 0,
                borderColor: isCredit ? NC_COLOR : ND_COLOR,
                color: isCredit ? NC_COLOR : ND_COLOR,
                background: isCredit ? '#f0f5ff' : '#fff7e6',
              }}
            >
              {getNoteLabel(adjustment)}
            </Tag>
            <span style={{ fontWeight: 500 }}>
              {formatSignedCurrency(adjustment.amount, isCredit)}
            </span>
          </div>
        )
      })}

      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          marginTop: 8,
          paddingTop: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span>Ajuste neto</span>
          <span style={{ fontWeight: 600 }}>
            {netAdjustment === 0
              ? formatCurrency(0)
              : formatSignedCurrency(netAdjustment, netAdjustment < 0)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span>Original</span>
          <span>{formatCurrency(originalTotal)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span>Total actual</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(adjustedTotal)}</span>
        </div>

        <Button type='primary' block onClick={goToBillManagement}>
          Ver en Gestión de Notas
        </Button>
      </div>
    </div>
  )

  const cellContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        cursor: hasAdjustments ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontWeight: hasAdjustments ? 600 : 400 }}>
        {formatAmount(adjustedTotal)}
      </span>
      {hasAdjustments && (
        <span
          style={{
            fontSize: 12,
            color: 'rgba(0, 0, 0, 0.45)',
            marginTop: 2,
          }}
        >
          Original: {formatAmount(originalTotal)}
        </span>
      )}
      {renderBadge()}
    </div>
  )

  if (!hasAdjustments) {
    return cellContent
  }

  return (
    <Popover
      trigger='click'
      placement='left'
      title='Ajustes de factura'
      content={popoverContent}
    >
      {cellContent}
    </Popover>
  )
}

export default BillingTotalCell
