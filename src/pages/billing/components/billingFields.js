import React, { useEffect, useState, useCallback } from 'react'
import debounce from 'lodash/debounce'
import {
  Button,
  Col,
  Divider,
  Input,
  message,
  Row,
  Select,
  Statistic,
  Typography,
} from 'antd'
import BillingProductsList from './billingProductsList'
import Tag from '../../../components/Tag'
import { useEditableList } from '../../../hooks'
import {
  showErrors,
  roundNumber,
  getPercent,
  formatPhone,
  numberFormat,
} from '../../../utils'
import billingSrc from '../billingSrc'
import FooterButtons from '../../../components/FooterButtons'
import SellerSelect from './SellerSelect'
import {
  appConfig,
  // documentsServiceType,
  productsTypes,
  productsStatus,
  documentsStatus,
  stakeholdersStatus,
  stakeholdersTypes,
} from '../../../commons/types'


const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const { getValue, getFormattedValue, groupSeparator } = numberFormat()

export const getProductDiscount = product =>
  product.service_type === productsTypes.SERVICE
    ? product.parent_unit_discount +
      product.child_unit_discount * product.quantity
    : product.unit_discount * product.quantity

export const getProductSubtotal = product => {
  const result =
    product.service_type === productsTypes.SERVICE
      ? (Number(product.parent_unit_price || 0) +
          Number(product.child_unit_price || 0)) *
        Number(product.quantity)
      : Number(product.unit_price) * Number(product.quantity)

  return roundNumber(result)
}

export const getStatisticFromProductWithTaxes = discountInputValue => product => {
  // childProduct
  const childTaxFix = product.child_tax_fee
    ? getPercent(product.child_tax_fee)
    : 0
  const childPriceWithoutTax = product.child_unit_price
    ? product.child_unit_price - product.child_unit_price * childTaxFix
    : 0
  const childBasePriceWithoutTax = product.child_base_unit_price
    ? product.child_base_unit_price -
      product.child_base_unit_price * childTaxFix
    : 0
  const childDiscount =
    childBasePriceWithoutTax * getPercent(discountInputValue)
  const childTax = childPriceWithoutTax
    ? product.child_unit_price - childPriceWithoutTax
    : 0
  // parentProduct
  const parentTaxFix = product.parent_tax_fee
    ? getPercent(product.parent_tax_fee)
    : 0
  const parentPriceWithoutTax = product.parent_unit_price
    ? product.parent_unit_price - product.parent_unit_price * parentTaxFix
    : 0
  const parentBasePriceWithoutTax = product.parent_base_unit_price
    ? product.parent_base_unit_price -
      product.parent_base_unit_price * parentTaxFix
    : 0
  const parentDiscount =
    parentBasePriceWithoutTax * getPercent(discountInputValue)
  const parentTax = parentPriceWithoutTax
    ? product.parent_unit_price - parentPriceWithoutTax
    : 0

  const discountFromProductWithTaxes =
    parentDiscount + childDiscount * Number(product.quantity)

  // Parent price now is multiplied by product quantity.
  const subtotalFromProductWithTaxes =
    parentPriceWithoutTax * Number(product.quantity) +
    childPriceWithoutTax * Number(product.quantity)
  const totalTaxFromProductWithTaxes =
    parentTax + childTax * Number(product.quantity)

  return {
    discountFromProductWithTaxes,
    subtotalFromProductWithTaxes,
    totalTaxFromProductWithTaxes,
  }
}

export const handleUpdateProductsData = ({
  parentProduct,
  childProduct,
  row,
  discountValue,
  field = '',
}) => {
  const getDisplayUnitPrice = displayFieldName => (product, row, unitPrice) => {
    if (!product) return row[displayFieldName]
    if (product?.unit_price === '' && row[displayFieldName] === 0) return 0
    if (product?.unit_price || product?.unit_price === 0)
      return product.unit_price

    return unitPrice
  }

  // parentProduct
  const parentBaseUnitPrice =
    parentProduct?.unit_price && field !== ''
      ? getValue(parentProduct.unit_price)
      : getValue(row.parent_base_unit_price)
  const parent_tax_fee = parentProduct?.tax_fee
    ? parentProduct.tax_fee
    : row.parent_tax_fee
  const parent_unit_discount =
    Number(parentBaseUnitPrice) * getPercent(discountValue)
  const parent_unit_price = roundNumber(
    Number(parentBaseUnitPrice) - Number(parent_unit_discount)
  )
  const parent_unit_tax_amount =
    Number(parent_unit_price) * getPercent(parent_tax_fee)
  const parent_base_unit_price =
    field === 'id' || field === 'child_id' || field === 'parent_unit_price'
      ? Number(parent_unit_price) + Number(parent_unit_discount)
      : row.parent_base_unit_price || Number(parent_unit_price)
  const getParentDisplayUnitPrice = getDisplayUnitPrice(
    'parent_display_unit_price'
  )
  const parent_display_unit_price = getParentDisplayUnitPrice(
    parentProduct,
    row,
    parent_unit_price
  )
  // childProduct
  const childBaseUnitPrice =
    childProduct?.unit_price && field !== ''
      ? getValue(childProduct.unit_price)
      : getValue(row.child_base_unit_price)
  const child_tax_fee = childProduct?.tax_fee
    ? Number(childProduct.tax_fee)
    : Number(row.child_tax_fee)
  const child_unit_discount =
    Number(childBaseUnitPrice) * getPercent(discountValue)
  const child_unit_price = roundNumber(
    Number(childBaseUnitPrice) - Number(child_unit_discount)
  )
  const child_unit_tax_amount =
    Number(child_unit_price) * getPercent(child_tax_fee)
  const child_base_unit_price =
    field === 'id' || field === 'child_id' || field === 'child_unit_price'
      ? Number(child_unit_price) + Number(child_unit_discount)
      : row.child_base_unit_price || Number(child_unit_price)
  const getChlidDisplayUnitPrice = getDisplayUnitPrice(
    'child_display_unit_price'
  )
  const child_display_unit_price = getChlidDisplayUnitPrice(
    childProduct,
    row,
    child_unit_price
  )
  // common fields
  const unit_discount = roundNumber(
    Number(child_unit_discount) + Number(parent_unit_discount)
  )
  const unit_price = roundNumber(
    Number(child_unit_price) + Number(parent_unit_price)
  )
  const unit_tax_amount = roundNumber(
    Number(child_unit_tax_amount) + Number(parent_unit_tax_amount)
  )

  const newRow = {
    ...row,
    // parentProduct
    parent_tax_fee,
    parent_unit_price: parent_display_unit_price
      ? parent_unit_price
      : parent_display_unit_price,
    parent_unit_tax_amount: parent_display_unit_price
      ? parent_unit_tax_amount
      : parent_display_unit_price,
    parent_unit_discount: parent_display_unit_price
      ? parent_unit_discount
      : parent_display_unit_price,
    parent_base_unit_price: parent_display_unit_price
      ? parent_base_unit_price
      : parent_display_unit_price,
    parent_display_unit_price,
    parent_inventory_unit_value:
      parentProduct?.inventory_unit_value || row?.parent_inventory_unit_value,
    // childProduct
    child_tax_fee,
    child_unit_price: child_display_unit_price
      ? child_unit_price
      : child_display_unit_price,
    child_unit_tax_amount: child_display_unit_price
      ? child_unit_tax_amount
      : child_display_unit_price,
    child_unit_discount: child_display_unit_price
      ? child_unit_discount
      : child_display_unit_price,
    child_base_unit_price: child_display_unit_price
      ? child_base_unit_price
      : child_display_unit_price,
    child_display_unit_price,
    child_inventory_unit_value:
      childProduct?.inventory_unit_value || row?.child_inventory_unit_value,
    // common fields
    id: parentProduct?.id ? Number(parentProduct.id) : row.id,
    code: parentProduct?.code ? parentProduct.code : childProduct?.code ? childProduct.code : row.code,//parentProduct?.code ? parentProduct.code : row.code,
    child_id: childProduct?.id ? Number(childProduct.id) : row.child_id,
    quantity:
      row.quantity && (field !== 'id' || field !== 'child_id')
        ? Number(String(row.quantity).replaceAll(groupSeparator, ''))
        : 0,
    tax_fee:
      unit_tax_amount && unit_price ? (unit_tax_amount / unit_price) * 100 : 0,
    unit_tax_amount,
    unit_price,
    unit_discount,
    base_unit_price: child_base_unit_price + parent_base_unit_price,
    description_product: childProduct?.description || row?.description_product,
    description_service: parentProduct?.description || row?.description_service,
  }

  const subtotal = getProductSubtotal(newRow)
  return { ...newRow, subtotal }
}

export const getOnChangeProductsListCallback = ({
  productsOptionsList,
  childProductsOptionsList,
  discountValue,
}) => (field, value, rowIndex) => {
  const getParentProduct = (field, value) => {
    const product = productsOptionsList.find(
      o => field === 'id' && Number(o.id) === Number(value)
    )

    const unit_price = value === undefined ? '0' : value
    return field === 'parent_unit_price' ? { unit_price } : product
  }

  const getChildProduct = (field, value) => {
    const product = childProductsOptionsList.find(
      o => field === 'child_id' && Number(o.id) === Number(value)
    )

    const unit_price = value === undefined ? '0' : value
    return field === 'child_unit_price' ? { unit_price } : product
  }

  return function setProductsDataCallback(prevState) {
    const row = prevState[rowIndex]
    const parentProduct = getParentProduct(field, value)
    const childProduct = getChildProduct(field, value)

    const updatedRow = handleUpdateProductsData({
      parentProduct,
      childProduct,
      row,
      discountValue,
      field,
    })

    return prevState.map((prevRow, index) =>
      index === rowIndex ? updatedRow : prevRow
    )
  }
}

export const editableListInitRow = {
  // common fields
  service_type: '',
  id: '',
  description: '',
  code: '',
  child_id: '',
  child_description: '',
  quantity: 1,
  unit_price: 0,
  base_unit_price: 0,
  unit_tax_amount: 0,
  tax_fee: 0,
  // parentProduct
  parent_tax_fee: 0,
  parent_unit_price: 0,
  parent_base_unit_price: 0,
  parent_unit_tax_amount: 0,
  parent_inventory_unit_value: 0,
  // childProduct
  child_tax_fee: 0,
  child_unit_price: 0,
  child_base_unit_price: 0,
  child_unit_tax_amount: 0,
  child_inventory_unit_value: 0,
  subtotal: 0,
}

export const billingLogicFactory = ({
  stakeholdersOptionsList,
  setProjectsOptionsList,
  productsData,
  isInvoiceFromSale,
  discountInputValue,
  setLoading,
  setData,
  data,
  setProductsOptionsList,
  setChildProductsOptionsList,
  setDiscountInputValue,
  setProductsData,
  handleSaveData,
  isSaleValidation = false,
}) => {
  const handleSearchProject = stakeholder_id => name => {
    if (name === '' || (!stakeholder_id && name !== null)) return

    const params = {
      stakeholder_id,
      name: { $like: `%25${name || ''}%25` },
    }

    setLoading(true)

    billingSrc
      .getProjectsOptions(params)
      .then(data => setProjectsOptionsList(data))
      .catch(error => showErrors(error))
      .finally(() => setLoading(false))
  }
  const getSaveData = () => {
    return {
      client_data: {
        id: data.stakeholder_id,
        name: data.client_name ? data.client_name : data.stakeholder_name,
        address: data.stakeholder_address,
        email: data.stakeholder_email,
        nit: data.stakeholder_nit,
        phone: data.stakeholder_phone,
      },
      document_id: data.id,
      stakeholder_id: data.stakeholder_id,
      seller_id: data.seller_id,
      project_id: data.project_id,
      created_at: data.created_at,
      start_date: data.start_date,
      end_date: data.end_date,
      payment_method: data.payment_method,
      credit_days: data.credit_days,
      dispatched_by: data.dispatched_by,
      received_by: data.received_by,
      comments: data.comments,
      subtotal_amount: data.subtotal,
      total_discount_amount: data.discount,
      total_tax_amount: data.total_tax,
      total_amount: data.total,
      description: data.description,
      products: productsData.reduce((r, p) => {
        const parentPriceWithoutTax = p.parent_base_unit_price
          ? p.parent_base_unit_price -
            p.parent_base_unit_price * getPercent(p.parent_tax_fee)
          : 0
        const parentProductDiscount =
          parentPriceWithoutTax * getPercent(discountInputValue)
        const parentProduct = {
          product_id: p.id,
          product_quantity:
            !p.child_id || isNaN(p.child_id) ? Number(p.quantity) : 1,
          product_price: parentPriceWithoutTax - parentProductDiscount,
          product_discount_percentage: discountInputValue
            ? Number(discountInputValue)
            : null,
          product_discount: parentProductDiscount || null,
          service_type: p.service_type,
          // Concat comments to service_description
          service_description:
            `${p.description_service}${p.comments ? '- ' + p.comments : ''}` ||
            p.description,
          service_user_price: p.parent_base_unit_price,
          code_product: p?.code
        }

        const childPriceWithoutTax = p.child_base_unit_price
          ? p.child_base_unit_price -
            p.child_base_unit_price * getPercent(p.child_tax_fee)
          : 0
        const childProductDiscount =
          childPriceWithoutTax * getPercent(discountInputValue)

        const childProduct = {
          product_id: p.child_id,
          product_quantity: Number(p.quantity),
          product_price: childPriceWithoutTax - childProductDiscount,
          product_discount_percentage: discountInputValue
            ? Number(discountInputValue)
            : null,
          product_discount: childProductDiscount || null,
          parent_product_id: p.id || null,
          service_type: p.service_type,
          // Concat comments to product_description
          product_description:
            p.child_description.length > 0
              ? `${p.child_description}${p.comments ? '- ' + p.comments : ''}`
              : `${p.description_product}${
                  p.comments ? '- ' + p.comments : ''
                }`,
          product_user_price: p.child_base_unit_price,
          product_comments: p.comments,
          code_product: p?.code
        }

        const products =
          !p.id || isNaN(p.id) ? [childProduct] : [childProduct, parentProduct]

        return [...(r || []), ...products]
      }, []),
    }
  }

  const validateSaveData = data => {
    const errors = []
    const billRequiredFields = [
      { key: 'stakeholder_id', value: 'Empresa' },
      { key: 'payment_method', value: 'Metodo de pago' },
      { key: 'project_id', value: 'Proyecto' },
    ]
    const saleRequiredFields = [
      { key: 'stakeholder_id', value: 'Empresa' },
      { key: 'project_id', value: 'Proyecto' },
      { key: 'start_date', value: 'Fecha Inicio' },
      { key: 'end_date', value: 'Fecha Final' },
    ]
    const requiredFields = isSaleValidation
      ? saleRequiredFields
      : billRequiredFields

    const requiredErrors = requiredFields.flatMap(field =>
      !data[field.key] ? field.value : []
    )
    if (requiredErrors.length > 0) {
      requiredErrors.forEach(k => {
        errors.push(`El campo ${k} es obligatorio`)
      })
    }

    /* const productsRequiredFields = ['product_quantity', 'product_price']

    const productErrors = validateSaleOrBillingProducts(
      data.products,
      productsRequiredFields,
      documentsServiceType.SERVICE
    )

    // Service without product associated validation
    if (productErrors.required.length > 0) {
      errors.push(
        `Los campos Precio y Cantidad de los productos en posicion ${productErrors.required.join(
          ', '
        )} deben ser mayor a cero`
      )
    }

    // Validation that prevents adding repeated products to the invoice detail
    Object.keys(productErrors.duplicate).forEach(k => {
      if (productErrors.duplicate[k]?.length > 1) {
        errors.push(
          `Los productos en posicion ${productErrors.duplicate[k].join(
            ', '
          )} no pueden estar duplicados`
        )
      }
    }) */

    if (!isSaleValidation && discountInputValue < 0) {
      errors.push(
        `El campo Descuento (%) debe contener un valor mayor o igual a cero`
      )
    }

    return {
      isInvalid: errors.length > 0,
      error: {
        message: errors,
      },
    }
  }

  return {
    handleSearchProject,

    handleDiscountChange: e => {
      const getParentProduct = p => ({
        id: p.id,
        code: p.code,
        tax_fee: p.parent_tax_fee,
        unit_tax_amount: p.parent_unit_tax_amount,
        unit_discount: p.parent_unit_discount,
      })

      const getChildProduct = p => ({
        id: p.child_id,
        tax_fee: p.child_tax_fee,
        unit_tax_amount: p.child_unit_tax_amount,
        unit_discount: p.child_unit_discount,
      })

      setDiscountInputValue(e?.target?.value)

      setProductsData(prevState => {
        return prevState.map(p => {
          const parentProduct = getParentProduct(p)
          const childProduct = getChildProduct(p)

          const updatedProduct = handleUpdateProductsData({
            parentProduct,
            childProduct,
            row: p,
            discountValue: e?.target?.value,
          })

          return updatedProduct
        })
      })
    },

    handleSearchProduct: rowIndex => product_description => {
      if (isInvoiceFromSale) return
      if (product_description === '') return
      if (!productsData[rowIndex].service_type)
        return message.warning('Debe seleccionar el Tipo de servicio')

      const params = {
        status: productsStatus.ACTIVE,
        stock: { $gt: 0 },
        open_parenthesis: 'description',
        close_parenthesis: 'nit',
        description: { $like: `%25${product_description}%25` },        
        nit: { $or: true, $like: `%25${product_description}%25` },        
        product_type: productsTypes.SERVICE,
      }

      setLoading(true)

      billingSrc
        .getProductsOptions(params)
        .then(data => setProductsOptionsList(data))
        .catch(error => showErrors(error))
        .finally(() => setLoading(false))
    },

    handleSearchChildProduct: rowIndex => product_description => {
      if (isInvoiceFromSale) return
      if (product_description === '') return
      if (!productsData[rowIndex].service_type)
        return message.warning('Debe seleccionar el Tipo de servicio')

      const params = {
        status: productsStatus.ACTIVE,
        stock: { $gt: 0 },
        open_parenthesis: 'description',
        close_parenthesis: 'nit',
        description: { $like: `%25${product_description}%25` },
        nit: { $or: true, $like: `%25${product_description}%25` },        
        product_type: productsTypes.PRODUCT,
      }

      setLoading(true)

      billingSrc
        .getProductsOptions(params)
        .then(data => setChildProductsOptionsList(data))
        .catch(error => showErrors(error))
        .finally(() => setLoading(false))
    },

    handleChange: field => e => {
      const value = e?.target?.value === undefined ? e : e.target.value

      if (field === 'stakeholder_id') {
        handleSearchProject(value)()

        const stakeholder = stakeholdersOptionsList.find(
          option => option.id === value
        )

        return setData(prevState => ({
          ...prevState,
          project_id: null,
          stakeholder_id: stakeholder.id,
          client_name: stakeholder.name,
          stakeholder_name: stakeholder.stakeholder_name,
          stakeholder_type: stakeholder.stakeholder_type,
          stakeholder_nit: stakeholder.nit,
          stakeholder_email: stakeholder.email,
          stakeholder_phone: formatPhone(stakeholder.phone),
          stakeholder_address: stakeholder.address,
          created_at: new Date().toISOString()
        }))
      }

      setData(prevState => ({
        ...prevState,
        [field]: value,
      }))
    },

    getSaveData,

    validateSaveData,

    saveData: async () => {
      const saveData = getSaveData()

      const { isInvalid, error } = validateSaveData(saveData)

      if (isInvalid) return showErrors(error)

      await handleSaveData(saveData)
    },
  }
}

// This function is used to collect errors through validations.
/* const validateSaleOrBillingProducts = (
  products,
  productsRequiredFields,
  serviceTypeService
) => {
  return products.reduce(
    (result, p, i) => {
      const newPosition =
        p.service_type === serviceTypeService ? Math.ceil((i + 1) / 2) : i + 1
      const positionsArray = [
        ...(result.duplicate[p.product_id] || []),
        newPosition,
      ]
      const newResult = {
        ...result,
        duplicate:
          p.product_id && !p.parent_product_id
            ? {
                ...result.duplicate,
                [p.product_id]: positionsArray,
              }
            : result.duplicate,
      }

      const hasRequiredError = productsRequiredFields.some(
        k =>
          (p.parent_product_id || p.parent_product_id === null) &&
          (!p[k] || p[k] <= 0)
      )

      if (hasRequiredError) {
        return {
          ...newResult,
          required: [...newResult.required, i + 1],
        }
      }

      return newResult
    },
    { required: [], duplicate: {} }
  )
} */

function BillingFields({
  setLoading,
  editData,
  isAdmin,
  isInvoiceFromSale,
  ...props
}) {
  const [stakeholdersOptionsList, setStakeholdersOptionsList] = useState([])
  const [projectsOptionsList, setProjectsOptionsList] = useState([])
  const [productsOptionsList, setProductsOptionsList] = useState([])
  const [childProductsOptionsList, setChildProductsOptionsList] = useState([])
  const [data, setData] = useState({})
  const [productsData, setProductsData] = useState([])
  const [discountInputValue, setDiscountInputValue] = useState(0)

  const {
    saveData,
    handleChange,
    handleSearchChildProduct,
    handleSearchProduct,
    handleDiscountChange,
    handleSearchProject,
  } = billingLogicFactory({
    stakeholdersOptionsList,
    setProjectsOptionsList,
    productsData,
    isInvoiceFromSale,
    discountInputValue,
    setLoading,
    setData,
    data,
    setProductsOptionsList,
    setChildProductsOptionsList,
    setDiscountInputValue,
    setProductsData,
    handleSaveData: props.handleSaveData,
  })

  const handleSearchStakeholder = useCallback(
    (stakeholder_name, additionalParams = {}) => {
      if (isInvoiceFromSale) return
      if (stakeholder_name === '') return

      const params = {
        name: { $like: `%25${stakeholder_name}%25` },
        status: stakeholdersStatus.ACTIVE,
        stakeholder_type: { $ne: stakeholdersTypes.PROVIDER },
        ...additionalParams,
      }

      setLoading(true)

      billingSrc
        .getStakeholdersOptions(params)
        .then(stakeholders => setStakeholdersOptionsList(stakeholders))
        .catch(error => showErrors(error))
        .finally(() => setLoading(false))
    },
    [setLoading, isInvoiceFromSale]
  )

  useEffect(
    function updateStatistics() {
      const getStatistics = getStatisticFromProductWithTaxes(discountInputValue)

      setData(prevDataState => {
        const totals = productsData?.reduce((r, p) => {
          // Esta es la implementacion normal (calcula subtotal de cada producto SIN impuesto)
          // const discount = (r.discount || 0) + getProductDiscount(p)
          // const subtotal = (r.subtotal || 0) + getProductSubtotal(p)
          // const total_tax = (r.total_tax || 0) + p.unit_tax_amount * p.quantity
          // const total = subtotal + total_tax

          // Esta es la implementacion que pidio el cliente (calcula subtotal de cada producto CON impuestos)
          const {
            discountFromProductWithTaxes,
            subtotalFromProductWithTaxes,
            totalTaxFromProductWithTaxes,
          } = getStatistics(p)
          const discount = (r.discount || 0) + discountFromProductWithTaxes
          const subtotal = (r.subtotal || 0) + subtotalFromProductWithTaxes
          const total_tax = (r.total_tax || 0) + totalTaxFromProductWithTaxes
          const total = subtotal + total_tax

          return {
            discount: roundNumber(discount) || 0,
            subtotal: roundNumber(subtotal) || 0,
            total_tax: roundNumber(total_tax) || 0,
            total: roundNumber(total) || 0,
            credit_days: prevDataState.credit_days
              ? prevDataState.credit_days
              : 0,
          }
        }, {})

        return { ...prevDataState, ...totals }
      })
    },
    [setData, productsData, isInvoiceFromSale, discountInputValue]
  )

  useEffect(() => {
    if (editData && !isInvoiceFromSale) return

    handleSearchStakeholder(null, {
      $limit: appConfig.selectsInitLimit,
      name: { $like: '%25%25' },
    })
  }, [handleSearchStakeholder, editData, isInvoiceFromSale])

  useEffect(() => {
    if (!editData) return

    setData(prevState => ({
      ...editData,
      stakeholder_phone: formatPhone(editData.stakeholder_phone),
      ...prevState,
      credit_days: Number(editData.credit_days),
    }))

    setProductsData(prevState =>
      prevState?.length > 1 ? prevState : editData.products
    )
    setDiscountInputValue(prevState =>
      prevState ? prevState : editData.discount_percentage || 0
    )
  }, [editData])

  useEffect(function cleanUp() {
    return () => {
      setData({})
      setProductsData([])
      setDiscountInputValue(0)
    }
  }, [])

  const updateInvoiceTotals = (field, value, rowIndex) => {
    if (field === 'service_type') {
      setProductsData(prevState => {
        const row = prevState[rowIndex]
        const newRow = { ...row, ...initRow, service_type: value }

        return prevState.map((v, i) => (i === rowIndex ? newRow : v))
      })

      return
    }

    const onChangeListCallback = getOnChangeProductsListCallback({
      productsOptionsList,
      childProductsOptionsList,
      discountValue:
        field !== 'parent_unit_price' && field !== 'child_unit_price'
          ? discountInputValue
          : 0,
    })

    const setProductsDataCallback = onChangeListCallback(field, value, rowIndex)

    setProductsData(setProductsDataCallback)
  }

  const updateInvoiceOnBlurPrice = (field, value, rowIndex) => {
    const onChangeListCallback = getOnChangeProductsListCallback({
      productsOptionsList,
      childProductsOptionsList,
      discountValue: discountInputValue,
    })

    const setProductsDataCallback = onChangeListCallback(field, value, rowIndex)

    setProductsData(setProductsDataCallback)
  }

  const {
    handleChange: handleChangeDetail,
    handleAdd: handleAddDetail,
    handleRemove: handleRemoveDetail,
    handleBlur: handleBlurDetail,
    rowModel: initRow,
  } = useEditableList({
    state: productsData,
    setState: setProductsData,
    initRow: editableListInitRow,
    onChange: updateInvoiceTotals,
    onBlur: updateInvoiceOnBlurPrice,
  })

  return (
    <>
      <div>
        {props.edit && (
          <>
            <Row>
              <Col xs={24} sm={24} md={12} lg={12}>
                <Title>{props.edit ? 'Factura' : 'Nueva Factura'}</Title>
              </Col>
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
                style={{ textAlign: 'right' }}
              >
                <Button className='title-cabisa new-button'>
                  Serie No. {data.id}
                </Button>
              </Col>
            </Row>

            {data.credit_status && data.status !== documentsStatus.CANCELLED && (
              <Row>
                <Col xs={24} sm={24} md={16} lg={16}></Col>
                <Col
                  xs={24}
                  sm={24}
                  md={8}
                  lg={8}
                  className='show-flex-component'
                >
                  <b
                    style={{ paddingRight: '1em' }}
                    className={'title-space-field'}
                  >
                    Estado de Credito
                  </b>
                  <Tag type='creditStatus' value={data.credit_status} />
                </Col>
              </Row>
            )}

            <Divider className={'divider-custom-margins-users'} />
          </>
        )}

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Selecciona Cliente</div>
            <Select
              disabled={props.edit || isInvoiceFromSale}
              className={'single-select'}
              placeholder={'Buscar cliente'}
              size={'large'}
              style={{ width: '100%' }}
              getPopupContainer={trigger => trigger.parentNode}
              optionFilterProp='children'
              showSearch
              onSearch={debounce(handleSearchStakeholder, 400)}
              onChange={handleChange('stakeholder_id')}
              value={data.stakeholder_id}
            >
              {stakeholdersOptionsList?.length > 0 ? (
                stakeholdersOptionsList.map(value => (
                  <Option key={value.id} value={value.id}>
                    {value.name}
                  </Option>
                ))
              ) : (
                <Option value={data.stakeholder_id}>
                  {data.stakeholder_name}
                </Option>
              )}
            </Select>
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>NIT</div>
            <Input
              placeholder={'Escribir NIT'}
              size={'large'}
              style={{ height: '40px' }}
              value={data.stakeholder_nit}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Tipo de cliente</div>
            <Select
              className={'single-select'}
              placeholder={'Elegir tipo'}
              size={'large'}
              style={{ width: '100%' }}
              getPopupContainer={trigger => trigger.parentNode}
              value={data.stakeholder_type}
              disabled
            >
              {props.stakeholderTypesOptionsList?.length > 0 ? (
                props.stakeholderTypesOptionsList.map(value => (
                  <Option key={value} value={value}>
                    <Tag type='stakeholderTypes' value={value} />
                  </Option>
                ))
              ) : (
                <Option value={data.stakeholder_type}>
                  <Tag type='stakeholderTypes' value={data.stakeholder_type} />
                </Option>
              )}
            </Select>
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Email</div>
            <Input
              placeholder={'Escribir email'}
              size={'large'}
              type={'email'}
              style={{ height: '40px' }}
              value={data.stakeholder_email}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Telefono</div>
            <Input
              placeholder={'Escribir telefono'}
              size={'large'}
              style={{ height: '40px' }}
              value={data.stakeholder_phone}
              disabled
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Direccion</div>
            <Input
              placeholder={'Escribir direccion'}
              size={'large'}
              style={{ height: '40px' }}
              value={data.stakeholder_address}
              disabled
            />
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Proyecto</div>
            <Select
              className={'single-select'}
              placeholder={'Proyecto'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              showSearch
              onSearch={debounce(handleSearchProject(data.stakeholder_id), 400)}
              value={data.project_id}
              onChange={handleChange('project_id')}
              loading={props.loading}
              optionFilterProp='children'
              disabled={props.edit || isInvoiceFromSale || !data.stakeholder_id}
            >
              {projectsOptionsList?.length > 0 ? (
                projectsOptionsList.map(value => (
                  <Option key={value.id} value={value.id}>
                    {value.name}
                  </Option>
                ))
              ) : (
                <Option value={data.project_id}>{data.project_name}</Option>
              )}
            </Select>
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Metodo de pago</div>
            <Select
              className={'single-select'}
              placeholder={'Metodo de pago'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={handleChange('payment_method')}
              value={data.payment_method}
              disabled={props.edit && !isAdmin}
            >
              {props.paymentMethodsOptionsList?.length > 0 ? (
                props.paymentMethodsOptionsList.map(value => (
                  <Option key={value} value={value}>
                    <Tag type='documentsPaymentMethods' value={value} />
                  </Option>
                ))
              ) : (
                <Option value={data.payment_method}>
                  <Tag
                    type='documentsPaymentMethods'
                    value={data.payment_method}
                  />
                </Option>
              )}
            </Select>
          </Col>
        </Row>

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Vendedor</div>
            <SellerSelect
              value={data.seller_id}
              onChange={handleChange('seller_id')}
              disabled={props.edit}
            />
          </Col>
        </Row>

        <Divider className={'divider-custom-margins-users'} />

        <Row
          gutter={16}
          className={'section-space-list'}
          justify='space-between'
          align='middle'
        >
          <Col xs={12} sm={12} md={12} lg={10}>
            <h1>Detalle Factura</h1>
          </Col>
          <Col
            xs={6}
            sm={6}
            md={6}
            lg={7}
            style={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <div
              style={{
                marginRight: '15px',
                marginTop: '10px',
                minWidth: '120px',
              }}
              className={'title-space-field'}
            >
              <b>Dias de credito:</b>
            </div>
            <Select
              className={'single-select'}
              placeholder={'Dias de credito'}
              size={'large'}
              style={{ width: '100%', height: '40px', maxWidth: '150px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={handleChange('credit_days')}
              value={data.credit_days}
              disabled={props.edit}
            >
              {props.creditDaysOptionsList?.length > 0 ? (
                <>
                  <Option value={0}>0</Option>
                  {props.creditDaysOptionsList.map(value => (
                    <Option key={value} value={value}>
                      {value}
                    </Option>
                  ))}
                </>
              ) : (
                <Option value={data.credit_days}>{data.credit_days}</Option>
              )}
            </Select>
          </Col>
          <Col
            xs={6}
            sm={6}
            md={6}
            lg={7}
            style={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <div
              style={{
                marginRight: '15px',
                marginTop: '10px',
                minWidth: '120px',
              }}
              className={'title-space-field'}
            >
              <b>Descuento (%):</b>
            </div>
            <Input
              type='tel'
              placeholder={'Aplicar Descuento'}
              size={'large'}
              style={{
                height: '40px',
                width: '75%',
                minWidth: '100px',
                maxWidth: '150px',
              }}
              min={0}
              onChange={handleDiscountChange}
              value={discountInputValue}
              disabled={props.edit && !isAdmin}
            />
          </Col>
        </Row>

        <Divider className={'divider-custom-margins-users'} />

        <BillingProductsList
          dataSource={productsData}
          handleAddDetail={handleAddDetail}
          handleChangeDetail={handleChangeDetail}
          handleRemoveDetail={handleRemoveDetail}
          handleBlurDetail={handleBlurDetail}
          handleSearchProduct={handleSearchProduct}
          productsOptionsList={productsOptionsList}
          handleSearchChildProduct={handleSearchChildProduct}
          childProductsOptionsList={childProductsOptionsList}
          isInvoiceFromSale={isInvoiceFromSale}
          isEditing={props.edit}
          serviceTypesOptionsList={props.serviceTypesOptionsList}
          isAdmin={isAdmin}
        />

        <Divider className={'divider-custom-margins-users'} />

        <Row gutter={16} style={{ textAlign: 'right' }} justify='end'>
          <Col span={6} style={{ textAlign: 'right' }}>
            <div className={'title-space-field'}>
              <Statistic
                title='Descuento :'
                value={getFormattedValue(data.discount)}
              />
            </div>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <div className={'title-space-field'}>
              <Statistic
                title='Subtotal :'
                value={getFormattedValue(data.subtotal)}
              />
            </div>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <div className={'title-space-field'}>
              <Statistic
                title='Impuesto :'
                value={getFormattedValue(data.total_tax)}
              />
            </div>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <div className={'title-space-field'}>
              <Statistic
                title='Total :'
                value={getFormattedValue(data.total)}
              />
            </div>
          </Col>
        </Row>

        <Divider className={'divider-custom-margins-users'} />
      </div>

      <Row gutter={16} className={'section-space-field'}>
        <Col xs={24} sm={24} md={24} lg={24}>
          <div className={'title-space-field'}>
            <b>Descripcion</b>
          </div>
          <TextArea
            rows={4}
            value={data.description}
            onChange={handleChange('description')}
            disabled={props.edit && !isAdmin}
          />
        </Col>
      </Row>

      {(!props.edit || isAdmin) && (
        <FooterButtons
          saveData={saveData}
          edit={props.edit}
          cancelButton={props.handleCancelButton}
          cancelLink={props.cancelLink}
          loading={props.loading}
        />
      )}
    </>
  )
}
export default BillingFields
