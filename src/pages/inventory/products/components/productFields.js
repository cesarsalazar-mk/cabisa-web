import React, { useEffect, useState } from 'react'
import { Storage } from 'aws-amplify'
import '../../../../amplify_config'
import {
  productsStatus,
  productsCategories,
  salesCategoryOptions,
} from '../../../../commons/types'
import FooterButtons from '../../../../components/FooterButtons'
import Tag from '../../../../components/Tag'
import {
  Col,
  Divider,
  Input,
  message,
  Row,
  Select,
  Typography,
  Upload,
} from 'antd'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { showErrors } from '../../../../utils'

const { Title } = Typography
const { Option } = Select

function ProductFields(props) {
  const [code, setCode] = useState('')
  const [serie, setSerie] = useState('')
  const [description, setDescription] = useState('')
  const [inventoryCategory, setInventoryCategory] = useState(null)
  const [salesCategory, setSalesCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [status, setStatus] = useState(null)
  // const [taxId, setTaxId] = useState(null)

  useEffect(() => {
    setLoading(props.loading)
  }, [props.loading])

  useEffect(() => {
    setImageUrl(props.edit ? props.editData.image_url : '')
    setCode(props.edit ? props.editData.code : '')
    setSerie(props.edit ? props.editData.serial_number : '')
    setDescription(props.edit ? props.editData.description : '')
    setInventoryCategory(
      props.edit
        ? props.editData.product_category
        : productsCategories.EQUIPMENT
    )
    setSalesCategory(props.edit ? props.editData.sales_category : null)
    setStatus(props.edit ? props.editData.status : productsStatus.ACTIVE)
    // setTaxId(props.edit ? props.editData.tax_id : productsTaxes.IVA)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visible])

  const saveData = () => {
    const errors = []
    const requiredValues = [code, description]

    if (requiredValues.some(v => !v))
      errors.push('Los campos Codigo y Descripcion son obligatorios.')

    if (errors.length > 0) return errors.forEach(e => message.warning(e))

    const data = {
      id: props?.editData?.id,
      code,
      serial_number: serie,
      description,
      product_category: inventoryCategory,
      sales_category: salesCategory || null,
      status,
      tax_id: 2, //taxId,
      image_url: imageUrl,
    }

    props.saveUserData(data)
  }

  const beforeUpload = file => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('Solo puede cargar imagenes en formato JPG o PNG')
    }
    const isLessThan500KB = file.size / 1024 < 500 // 500 KB
    if (!isLessThan500KB) {
      message.error('La imagen debe ser menor a 500 KB')
    }
    return isJpgOrPng && isLessThan500KB
  }

  const uploadImage = ({ file }) => {
    const currentTime = new Date().getTime()
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'))
    const fileName = `CABISA_${currentTime}${fileExtension}`
    setImageUrl(null)
    setLoading(true)

    Storage.put(fileName, file, {
      level: 'public',
      contentType: 'image/png',
    })
      .then(result => {
        Storage.get(result.key).then(url => {
          const urlWithoutParams = url.substring(0, url.indexOf('?'))
          setImageUrl(urlWithoutParams)
        })
      })
      .catch(error => {
        showErrors(error)
      })
      .finally(() => setLoading(false))
  }

  const UploadButton = () => {
    return (
      <div>
        {loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div>{loading ? 'Subiendo...' : 'Subir foto'}</div>
      </div>
    )
  }

  return (
    <>
      <div>
        {props.edit && (
          <>
            <Title>{props.edit ? 'Editar Producto' : 'Nuevo Producto'}</Title>
            <Divider className={'divider-custom-margins-users'} />
          </>
        )}

        <Row gutter={16} className={'section-space-field'}>
          <Col xs={10} sm={10} md={10} lg={10}>
            <div className={'title-space-field'}>Codigo</div>
            <Input
              value={code}
              placeholder={'Codigo'}
              size={'large'}
              onChange={value => setCode(value.target.value)}
            />
          </Col>
          <Col xs={10} sm={10} md={10} lg={10}>
            <div className={'title-space-field'}>No. Serie</div>
            <Input
              value={serie}
              placeholder={'No. Serie'}
              size={'large'}
              onChange={value => setSerie(value.target.value)}
            />
          </Col>
          <Col xs={4} sm={4} md={4} lg={4} style={{ textAlign: 'center' }}>
            <Upload
              name='avatar'
              listType='picture-card'
              className='avatar-uploader'
              showUploadList={false}
              customRequest={uploadImage}
              beforeUpload={beforeUpload}
              maxCount={1}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt='avatar'
                  style={{ width: '102px', height: '102px' }}
                />
              ) : (
                UploadButton()
              )}
            </Upload>
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Descripcion</div>
            <Input
              value={description}
              placeholder={'Descripcion'}
              size={'large'}
              onChange={value => setDescription(value.target.value)}
            />
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Tipo de inventario</div>
            <Select
              value={inventoryCategory}
              className={'single-select'}
              placeholder={'Tipo de inventario'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => setInventoryCategory(value)}
            >
              {props.productCategoriesList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='productCategories' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Categoria</div>
            <Select
              allowClear
              value={salesCategory}
              className={'single-select'}
              placeholder={'Categoria'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => setSalesCategory(value || null)}
            >
              {salesCategoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag type='salesCategories' value={option.value} />
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Estado</div>
            <Select
              defaultValue={productsStatus.ACTIVE}
              value={status}
              className={'single-select'}
              placeholder={'Estado'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => setStatus(value)}
            >
              {props.productStatusList?.map(value => (
                <Option key={value} value={value}>
                  <Tag type='productStatus' value={value} />
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={16} className={'section-space-field'}>
          {/* <Col xs={8} sm={8} md={8} lg={8}>
            <div className={'title-space-field'}>Impuesto</div>
            <Select
              value={taxId}
              className={'single-select'}
              placeholder={'Tipo de impuesto'}
              size={'large'}
              style={{ width: '100%', height: '40px' }}
              getPopupContainer={trigger => trigger.parentNode}
              onChange={value => setTaxId(value)}
            >
              {props.productsTaxesList?.map(t => (
                <Option key={t.id} value={t.id}>
                  {`${t.name} - (${t.fee}%)`}
                </Option>
              ))}
            </Select>
          </Col> */}
        </Row>
      </div>
      <FooterButtons
        saveData={saveData}
        cancelButton={props.cancelButton}
        edit={props.edit}
        cancelLink='/inventoryProducts'
        loading={loading}
      />
    </>
  )
}

export default ProductFields
