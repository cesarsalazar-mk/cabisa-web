import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import billingSrc from '../billingSrc'
import { showErrors } from '../../../utils'

const { Option } = Select

// includeInactive: lista tambien vendedores inactivos (filtros de reportes).
// fallbackName: nombre del vendedor actual, para mostrarlo aunque este inactivo y no venga en la lista.
function SellerSelect({ value, onChange, disabled, includeInactive, fallbackName }) {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)

    billingSrc
      .getSellers(includeInactive ? { include_inactive: '1' } : undefined)
      .then(setSellers)
      .catch(showErrors)
      .finally(() => setLoading(false))
  }, [includeInactive])

  const isMissing = value && fallbackName && !sellers.some(seller => Number(seller.id) === Number(value))

  return (
    <Select
      className={'single-select'}
      placeholder={'Selecciona Vendedor'}
      size={'large'}
      style={{ width: '100%', height: '40px' }}
      getPopupContainer={trigger => trigger.parentNode}
      showSearch
      allowClear
      optionFilterProp='children'
      loading={loading}
      disabled={disabled}
      value={value || undefined}
      onChange={onChange}
    >
      {isMissing && (
        <Option key={value} value={value}>
          {fallbackName} (inactivo)
        </Option>
      )}
      {sellers.map(seller => (
        <Option key={seller.id} value={seller.id}>
          {seller.name}
          {includeInactive && !seller.is_active ? ' (inactivo)' : ''}
        </Option>
      ))}
    </Select>
  )
}

export default SellerSelect
