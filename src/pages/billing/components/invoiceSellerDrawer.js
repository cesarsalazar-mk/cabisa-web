import React, { useEffect, useState } from 'react'
import { Button, Divider, Drawer, message, Spin } from 'antd'
import SellerSelect from './SellerSelect'
import billingSrc from '../billingSrc'
import { showErrors } from '../../../utils'

function InvoiceSellerDrawer({ invoice, onClose, onSaved }) {
  const [sellerId, setSellerId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => setSellerId(invoice?.seller_id || null), [invoice])

  const save = () => {
    setSaving(true)

    billingSrc
      .updateInvoiceSeller({ id: invoice.id, seller_id: sellerId })
      .then(() => {
        message.success('Vendedor actualizado')
        onSaved()
      })
      .catch(showErrors)
      .finally(() => setSaving(false))
  }

  return (
    <Drawer
      title={`Vendedor de la factura ${invoice?.document_number || invoice?.id || ''}`}
      placement='right'
      width={400}
      visible={!!invoice}
      onClose={onClose}
      destroyOnClose
    >
      <Spin spinning={saving}>
        <div className={'title-space-field'}>Vendedor</div>
        <SellerSelect value={sellerId} onChange={setSellerId} fallbackName={invoice?.seller_name} />
        <Divider />
        <div className='text-right'>
          <Button type={'link'} className='cancel-button' onClick={onClose}>
            Cancelar
          </Button>
          <Button className='title-cabisa new-button' onClick={save}>
            Guardar
          </Button>
        </div>
      </Spin>
    </Drawer>
  )
}

export default InvoiceSellerDrawer
