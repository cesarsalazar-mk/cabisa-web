import salesSrc from '../../salesSrc'

const saleActions = {
  fetchChildProductsOptions: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_CHILD_PRODUCTS_OPTIONS START' })
    try {
      const childProductsOptionsList = await salesSrc.getProductsOptions({
        ...params,
      })
      dispatch({
        type: 'FETCH_CHILD_PRODUCTS_OPTIONS END',
        childProductsOptionsList,
      })
    } catch (error) {
      dispatch({ type: 'FETCH_CHILD_PRODUCTS_OPTIONS ERROR', error })
    }
  },

  fetchProductsOptions: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_PRODUCTS_OPTIONS START' })
    try {
      const productsOptionsList = await salesSrc.getProductsOptions({
        ...params,
      })
      dispatch({ type: 'FETCH_PRODUCTS_OPTIONS END', productsOptionsList })
    } catch (error) {
      dispatch({ type: 'FETCH_PRODUCTS_OPTIONS ERROR', error })
    }
  },

  fetchProjectsOptions: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_PROJECTS_OPTIONS START' })
    try {
      const projectsOptionsList = await salesSrc.getProjectsOptions({
        ...params,
      })
      dispatch({ type: 'FETCH_PROJECTS_OPTIONS END', projectsOptionsList })
    } catch (error) {
      dispatch({ type: 'FETCH_PROJECTS_OPTIONS ERROR', error })
    }
  },

  fetchStakeholdersOptions: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_STAKEHOLDERS_OPTIONS START' })
    try {
      const stakeholdersOptionsList = await salesSrc.getStakeholdersOptions({
        ...params,
      })
      dispatch({
        type: 'FETCH_STAKEHOLDERS_OPTIONS END',
        stakeholdersOptionsList,
      })
    } catch (error) {
      dispatch({ type: 'FETCH_STAKEHOLDERS_OPTIONS ERROR', error })
    }
  },

  fetchDocumentServiceTypeOptions: async dispatch => {
    dispatch({ type: 'FETCH_DOCUMENT_SERVICE_TYPE_OPTIONS START' })
    try {
      const documentServiceTypesOptionsList = await salesSrc.getServiceTypes()
      dispatch({
        type: 'FETCH_DOCUMENT_SERVICE_TYPE_OPTIONS END',
        documentServiceTypesOptionsList,
      })
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENT_SERVICE_TYPE_OPTIONS ERROR', error })
    }
  },

  fetchSales: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_SALES START' })
    try {
      const result = await salesSrc.getSales({ ...params })
      dispatch({
        type: 'FETCH_SALES END',
        sales: result.items || result,
        pagination: result.pagination,
      })
    } catch (error) {
      dispatch({ type: 'FETCH_SALES ERROR', error })
    }
  },

  fetchSalesStatus: async dispatch => {
    dispatch({ type: 'FETCH_SALES_STATUS START' })
    try {
      const salesStatusList = await salesSrc.getSalesStatus()
      dispatch({ type: 'FETCH_SALES_STATUS END', salesStatusList })
    } catch (error) {
      dispatch({ type: 'FETCH_SALES_STATUS ERROR', error })
    }
  },

  approveSale: async (dispatch, data) => {
    dispatch({ type: 'APPROVE_SALE START' })
    try {
      const approvedSaleId = await salesSrc.approveSale(data)
      dispatch({ type: 'APPROVE_SALE END', approvedSaleId })
    } catch (error) {
      dispatch({ type: 'APPROVE_SALE ERROR', error })
    }
  },

  cancelSale: async (dispatch, data) => {
    dispatch({ type: 'CANCEL_SALE START' })
    try {
      const cancelledSaleId = await salesSrc.cancelSale(data)
      dispatch({ type: 'CANCEL_SALE END', cancelledSaleId })
    } catch (error) {
      dispatch({ type: 'CANCEL_SALE ERROR', error })
    }
  },

  createSale: async (dispatch, data) => {
    let products = data.products
    data.products = products.filter(
      product =>
        product.parent_product_id === null ||
        product.parent_product_id === undefined
    )
    dispatch({ type: 'CREATE_SALE START' })
    try {
      const createdSaleId = await salesSrc.createSale(data)
      dispatch({ type: 'CREATE_SALE END', createdSaleId })
    } catch (error) {
      dispatch({ type: 'CREATE_SALE ERROR', error })
    }
  },

  updateSale: async (dispatch, data) => {
    let products = data.products
    data.products = products.filter(
      product =>
        product.parent_product_id === null ||
        product.parent_product_id === undefined
    )
    
    dispatch({ type: 'UPDATE_SALE START' })
    try {
      const updatedSaleId = await salesSrc.updateSale(data)
      dispatch({ type: 'UPDATE_SALE END', updatedSaleId })
    } catch (error) {
      dispatch({ type: 'UPDATE_SALE ERROR', error })
    }
  },

  setSaleState: async (dispatch, data) => dispatch({ type: 'SET', data }),

  fetchServiceOrders: async (dispatch, params = {}) => {
    dispatch({ type: 'FETCH_SERVICE_ORDERS START' })
    try {
      const result = await salesSrc.getServiceOrders({ ...params })
      const sales = result.items || result
      dispatch({ type: 'FETCH_SERVICE_ORDERS END', sales })
    } catch (error) {
      dispatch({ type: 'FETCH_SERVICE_ORDERS ERROR', error })
    }
  },
}

export default saleActions
