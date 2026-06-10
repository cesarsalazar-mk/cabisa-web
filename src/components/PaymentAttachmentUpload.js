import React, { useState } from 'react'
import { Upload, message, Button } from 'antd'
import { LoadingOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons'
import { Storage } from 'aws-amplify'
import '../amplify_config'
import { showErrors } from '../utils'

const MAX_SIZE_MB = 5

function PaymentAttachmentUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)

  const beforeUpload = file => {
    const isLessThan5MB = file.size / 1024 / 1024 <= MAX_SIZE_MB
    if (!isLessThan5MB) {
      message.error('El archivo debe ser menor o igual a 5 MB')
    }
    return isLessThan5MB
  }

  const uploadFile = ({ file }) => {
    const currentTime = new Date().getTime()
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'))
    const fileName = `PAYMENT_${currentTime}${fileExtension}`
    setUploading(true)

    Storage.put(fileName, file, {
      level: 'public',
      contentType: file.type || 'application/octet-stream',
    })
      .then(result =>
        Storage.get(result.key).then(url => {
          const urlWithoutParams = url.substring(0, url.indexOf('?'))
          onChange(urlWithoutParams)
        })
      )
      .catch(error => showErrors(error))
      .finally(() => setUploading(false))
  }

  if (value) {
    return (
      <div className='payment-attachment-actions'>
        <Button
          type='link'
          size='small'
          icon={<PaperClipOutlined />}
          href={value}
          target='_blank'
          rel='noopener noreferrer'
        >
          Ver
        </Button>
        {!disabled && (
          <Button
            type='link'
            size='small'
            danger
            icon={<DeleteOutlined />}
            onClick={() => onChange('')}
          />
        )}
      </div>
    )
  }

  return (
    <Upload
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={uploadFile}
      disabled={disabled || uploading}
    >
      <Button size='small' disabled={disabled || uploading}>
        {uploading ? <LoadingOutlined /> : <PaperClipOutlined />}
        {uploading ? ' Subiendo...' : ' Adjunto'}
      </Button>
    </Upload>
  )
}

export default PaymentAttachmentUpload
