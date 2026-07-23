import React from 'react'
import { Button, Col, Row, Typography, Space } from 'antd'
// Context
import { validatePermissions } from '../utils'
import { actions } from '../commons/types'
const { Title } = Typography

function HeaderPage(props) {
  const handlerShowDrawer = () => {
    props.showDrawer()
  }

  const canCreate = validatePermissions(props.permissions)(actions.CREATE)

  return (
    <Row
      type='flex'
      justify='center'
      align='top'
      className={props.cleanHeader ? 'margin-clean-top' : 'margin-top-40'}
    >
      <>
        <Col xs={24} sm={24} md={12} lg={props.exportButton ? 16 : 20}>
          <Title>{props.title}</Title>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={{ span: props.exportButton ? 8 : 4, offset: 0 }}
          className='text-right'
        >
          <Space>
            {props.exportButton && (
              <Button
                className={
                  canCreate
                    ? 'title-cabisa new-button'
                    : 'hide-component title-cabisa new-button'
                }
                onClick={props.onExport}
              >
                {props.exportButton}
              </Button>
            )}
            {props.titleButton && (
              <Button
                className={
                  canCreate
                    ? 'title-cabisa new-button'
                    : 'hide-component title-cabisa new-button'
                }
                onClick={handlerShowDrawer}
              >
                {props.titleButton}
              </Button>
            )}
          </Space>
        </Col>
      </>
    </Row>
  )
}

export default HeaderPage
