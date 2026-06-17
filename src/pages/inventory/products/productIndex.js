import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react'
import HeaderPage from '../../../components/HeaderPage'
import InventoryProduct from './components/inventoryProduct'
import InventorySrc from '../inventorySrc'
import { message } from 'antd'
import { showErrors } from '../../../utils'
import { permissions } from '../../../commons/types'

const defaultPagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}

const CONTENT_PADDING_BOTTOM = 24

function getAvailablePageHeight(pageTop) {
  const footer = document.querySelector('.ant-layout-footer')
  const footerHeight = footer?.getBoundingClientRect().height || 30

  return window.innerHeight - pageTop - footerHeight - CONTENT_PADDING_BOTTOM
}

function ProductIndex() {
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)
  const [inventoryProducts, setInventoryProducts] = useState([])
  const [productCategoriesList, setProductCategoriesList] = useState([])
  const [productStatusList, setProductStatusList] = useState([])
  const [productsTaxesList, setProductsTaxesList] = useState([])
  const [searchText, setSearchText] = useState('')
  const [searchTextCode, setSearchTextCode] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pagination, setPagination] = useState(defaultPagination)
  const [loading, setLoading] = useState(false)

  const getProductParams = (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => ({
    description: { $like: `%25${searchText}%25` },
    code: searchTextCode,
    product_category: categoryFilter,
    $limit: pageSize,
    $offset: (page - 1) * pageSize,
  })

  const getProducts = useCallback(() => {
    setLoading(true)

    InventorySrc.getProducts(getProductParams())
      .then(result => {
        setInventoryProducts(result.items || result)
        setPagination(prevState => ({
          ...prevState,
          total: result.pagination?.total || 0,
        }))
      })
      .catch(err => {
        console.log('ERROR ON GET INVENTORY PRODUCTS', err)
        message.warning('No se ha podido obtener informacion del inventario.')
      })
      .finally(() => setLoading(false))
  }, [searchText, searchTextCode, categoryFilter, pagination.current, pagination.pageSize])

  useEffect(() => {
    getProducts()
  }, [getProducts])

  useEffect(() => {
    setLoading(true)

    Promise.all([
      InventorySrc.getProductsStatus(),
      InventorySrc.getProductsCategories(),
      InventorySrc.getProductsTaxes(),
    ])
      .then(result => {
        setProductStatusList(result[0])
        setProductCategoriesList(result[1])
        setProductsTaxesList(result[2])
      })
      .catch(err => {
        console.log('ERROR ON GET INVENTORY PRODUCTS', err)
        message.warning('No se ha podido obtener informacion del inventario.')
      })
      .finally(() => setLoading(false))
  }, [])

  useLayoutEffect(() => {
    const updatePageHeight = () => {
      if (!pageRef.current) return

      const { top } = pageRef.current.getBoundingClientRect()
      setPageHeight(getAvailablePageHeight(top))
    }

    updatePageHeight()
    window.addEventListener('resize', updatePageHeight)

    const frameId = requestAnimationFrame(updatePageHeight)

    return () => {
      window.removeEventListener('resize', updatePageHeight)
      cancelAnimationFrame(frameId)
    }
  }, [loading, inventoryProducts])

  const searchByTxt = description => {
    setSearchText(description)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const searchByTxtCode = code => {
    setSearchTextCode(code)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const searchByCategory = category => {
    setCategoryFilter(category)
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prevState => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }

  const clearSearch = () => {
    setSearchText('')
    setSearchTextCode('')
    setCategoryFilter('')
    setPagination(prevState => ({ ...prevState, current: 1 }))
  }

  const deleteProduct = data => {
    setLoading(true)

    InventorySrc.deleteProduct(data)
      .then(_ => {
        message.success('Elemento eliminado')
        clearSearch()
      })
      .catch(err => showErrors(err))
      .finally(() => setLoading(false))
  }

  return (
    <div
      ref={pageRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: pageHeight ?? undefined,
        maxHeight: pageHeight ?? undefined,
        overflow: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <HeaderPage
          titleButton={''}
          title={'Productos'}
          permissions={permissions.INVENTARIO}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <InventoryProduct
          title={'Productos'}
          searchByCategory={searchByCategory}
          searchByTxt={searchByTxt}
          searchByTxtCode={searchByTxtCode}
          categoryFilter={categoryFilter}
          dataSource={inventoryProducts}
          closeAfterSaveWareHouse={clearSearch}
          deleteItemWareHouse={deleteProduct}
          loading={loading}
          productStatusList={productStatusList}
          productCategoriesList={productCategoriesList}
          productsTaxesList={productsTaxesList}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  )
}

export default ProductIndex
