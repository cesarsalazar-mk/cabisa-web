import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import HeaderPage from '../../components/HeaderPage'
import { message, Card } from 'antd'
import BillingFields from './components/billingFields'
import billingSrc from './billingSrc'
import { showErrors, validateRole } from '../../utils'
import {
  stakeholdersTypes,
  roles,
  documentsPaymentMethods,
} from '../../commons/types'

function BillingView() {
  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const [paymentMethodsOptionsList, setPaymentMethodsOptionsList] = useState([])
  const [
    stakeholderTypesOptionsList,
    setStakeholderTypesOptionsList,
  ] = useState([])
  const [serviceTypesOptionsList, setServiceTypesOptionsList] = useState([])
  const [creditDaysOptionsList, setCreditDaysOptionsList] = useState([])

  const isAdmin = validateRole(roles.ADMIN)

  useEffect(() => {
    setPaymentMethodsOptionsList([
      documentsPaymentMethods.CARD,
      documentsPaymentMethods.CASH,
    ])

    setLoading(true)

    Promise.all([
      billingSrc.getStakeholderTypes(),
      billingSrc.getServiceTypes(),
      billingSrc.getCreditDays(),
    ])
      .then(data => {
        const stakeholdersTypesList = data[0].filter(
          s => s !== stakeholdersTypes.PROVIDER
        )

        setStakeholderTypesOptionsList(stakeholdersTypesList)
        setServiceTypesOptionsList(data[1])
        setCreditDaysOptionsList(data[2])
      })
      .catch(_ => message.error('Error al cargar listados'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveData = async saveData => {
    const products = saveData.products
    const draftData = {
      ...saveData,
      products: products.filter(
      product =>
        product.parent_product_id === null ||
        product.parent_product_id === undefined
      ),
    }

    setLoading(true)

    try {
      const draftResponse = await billingSrc.createInvoiceDraft(draftData)
      const documentId = draftResponse?.data?.document_id

      if (!documentId) {
        throw new Error('No se pudo crear el borrador de la factura')
      }

      const certifyResponse = await billingSrc.certifyInvoiceDraft(documentId)

      if (certifyResponse?.data?.status === 'SAT_FAILED') {
        message.warning(
          'La factura quedo en estado Fallo SAT. Puedes reintentar la certificacion desde Facturacion.'
        )
      } else {
        message.success('Factura creada exitosamente')
      }

      history.push('/billing')
    } catch (error) {
      setLoading(false)
      showErrors(error)
      return
    }

    setLoading(false)
  }

  return (
    <>
      <HeaderPage titleButton={''} title={'Nueva Factura'} bill={true} />
      <Card className={'card-border-radius margin-top-15'}>
        <BillingFields
          edit={false}
          loading={loading}
          setLoading={setLoading}
          handleSaveData={handleSaveData}
          paymentMethodsOptionsList={paymentMethodsOptionsList}
          stakeholderTypesOptionsList={stakeholderTypesOptionsList}
          serviceTypesOptionsList={serviceTypesOptionsList}
          creditDaysOptionsList={creditDaysOptionsList}
          cancelLink='/billing'
          isAdmin={isAdmin}
        />
      </Card>
    </>
  )
}
export default BillingView
