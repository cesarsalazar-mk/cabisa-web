const fetchSalesReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_SALES START':
      return { ...state, status: 'LOADING', loading: 'fetchSales', error: null }
    case 'FETCH_SALES END':
      return {
        ...state,
        sales: action.sales,
        salesPagination: {
          ...state.salesPagination,
          total: action.pagination?.total || 0,
        },
        status: 'SUCCESS',
        loading: 'fetchSales',
        error: null,
      }
    case 'FETCH_SALES ERROR':
      return {
        ...state,
        status: 'ERROR',
        loading: 'fetchSales',
        error: action.error,
      }
    default:
      throw new Error(
        `Unhandled action type: ${action.type} on fetchSalesReducer`
      )
  }
}

export default fetchSalesReducer
