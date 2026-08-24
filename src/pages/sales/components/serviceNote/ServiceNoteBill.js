import React, { useState, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Spin, message, Card } from 'antd'
import HeaderPage from '../../../../components/HeaderPage'
import billingSrc from '../../../billing/billingSrc'
import saleSrc from '../../salesSrc'
import BillingFieldsTwo from '../../../billing/components/billingFieldsTwo'
import { showErrors } from '../../../../utils'
import { getDetailData } from '../../../billing/billingIndex'
import { documentsPaymentMethods } from '../../../../commons/types'

function ServiceNoteBill() {
  const location = useLocation()
  const history = useHistory()

  const [loading, setLoading] = useState(false)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])
  const [serviceTypesOptionsList, setServiceTypesOptionsList] = useState([])
  const [creditDaysOptionsList, setCreditDaysOptionsList] = useState([])

  useEffect(() => {
    setPaymentMethodsOptionsList([
      documentsPaymentMethods.CARD,
      documentsPaymentMethods.CASH,
    ])

    setLoading(true)

    Promise.all([billingSrc.getServiceTypes(), billingSrc.getCreditDays()])
      .then(data => {
        setServiceTypesOptionsList(data[0])
        setCreditDaysOptionsList(data[1])
      })
      .catch(_ => message.error('Error al cargar listados'))
      .finally(() => setLoading(false))
  }, [location])

  const handleSaveData = async saveData => {
    setLoading(true)

    try {
      const documentId = saveData.document_id
      const certifyResponse = await saleSrc.certifySale(documentId, saveData)

      if (certifyResponse?.data?.status === 'SAT_FAILED') {
        message.warning(
          'La factura quedo en estado Fallo SAT. Puedes reintentar la certificacion desde Ventas.'
        )
      } else {
        message.success('Factura creada exitosamente')
      }

      history.push('/sales')
    } catch (error) {
      showErrors(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <HeaderPage titleButton={''} title={'Nueva Factura'} bill={true} />
      <Card className={'card-border-radius margin-top-15'}>
        <BillingFieldsTwo
          isInvoiceFromSale
          edit={false}
          loading={loading}
          editData={getDetailData(location.state)}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          serviceTypesOptionsList={serviceTypesOptionsList}
          creditDaysOptionsList={creditDaysOptionsList}
          cancelLink='/sales'
          handleSaveData={handleSaveData}
        />
      </Card>
    </Spin>
  )
}
export default ServiceNoteBill
