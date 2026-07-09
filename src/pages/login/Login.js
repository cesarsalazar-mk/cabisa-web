import React, { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  message,
  Col,
  notification,
  Spin,
} from 'antd'
import { Auth, Cache } from 'aws-amplify'
import '../../amplify_config'
import UserSrc from '../users/usersSrc'
import { showErrors } from '../../utils'
const mssError = 'Debes ingresar usuario y contraseña'

function Login() {
  const [cognitoUserInfo, setCognitoUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const [confirmUsername, setConfirmUsername] = useState('')
  const [codeConfirm, setCodeConfirm] = useState('')
  const [isModalConfirmVisible, setIsModalConfirmVisible] = useState(false)
  const [isModalResetVisible, setIsModalResetVisible] = useState(false)
  const [userName, setUserName] = useState('')

  const handleSubmit = async value => {
    let usernameE = value.username
    let passwordE = value.password
    try {
      setLoading(true)
      if (!usernameE || !passwordE) {
        throw mssError
      } else {
        setUserName(value.username)
        Auth.signIn(usernameE, passwordE)
          .then(user => {
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
              setCognitoUserInfo(user)
              setIsModalVisible(true)
              return
            }

            UserSrc.getUsersPermissions(
              encodeURIComponent(user.attributes.email)
            )
              .then(([userData]) => {
                const profileSettings = {
                  token: user.signInUserSession.accessToken.jwtToken,
                  userName: user.attributes.name,
                  cognitoUsername: user.username,
                  userPermissions: userData?.permissions || [],
                  email: user.attributes.email,
                  rol_id: userData?.rol_id,
                  rol_name: userData?.rol_name,
                  user_id: userData?.id,
                  sales_commission: userData?.sales_commission
                    ? Number(userData.sales_commission)
                    : null,
                }

                if (profileSettings.userPermissions.length === 0) {
                  message.error('Usuario/Password incorrectos')
                  setLoading(false)
                } else {
                  Cache.setItem('currentSession', profileSettings)
                  message.success('Bienvenido!')
                  window.location.reload(false)
                }
              })
              .catch(err => {
                setLoading(false)
                console.log('ERROR ON GET USER PERMISSIONS', err)
                message.error('Usuario/Password incorrectos')
              })
          })
          .catch(e => {
            console.error('ERROR ON LOGIN', e)
            setLoading(false)
            if (e.message.indexOf('User is not confirmed.') > -1) {
              openNotification()
            } else if (
              e.message.indexOf('Password reset required for the user') > -1
            ) {
              openNotificationResetPassword(usernameE)
            } else {
              showErrors(e)
            }
          })
      }
    } catch (err) {
      setLoading(false)
      message.error(err)
    }
  }

  const onFinishFailed = errorInfo => {
    errorInfo.errorFields.map(error => message.error(error.errors))
  }

  const completeNewPassword = () => {
    if (newPass === '') {
      return message.error('Debes ingresar tu Nueva contraseña')
    }

    if (newPass !== confirmPass) {
      return message.error('Contraseñas no coinciden')
    }

    Auth.completeNewPassword(cognitoUserInfo, confirmPass, {
      name: cognitoUserInfo.username,
    })
      .then(_ => {
        setIsModalVisible(false)
        message.success('Bien.. Ahora puedes Iniciar session!')
      })
      .catch(err => {
        console.log(err)
        message.error('Ha ocurrido un error vuelve a intentarlo')
      })
  }

  const forgotPassword = userName => {
    Auth.forgotPassword(userName)
      .then(result => {
        console.log(result)
        setIsModalResetVisible(true)
      })
      .catch(err => {
        console.log(err)
        message.error(
          'Ha ocurrido un al enviar el codigo de seguridad a tu correo electronico, contacta al administrador.'
        )
      })
  }

  const forgotPasswordSubmit = _ => {
    if (newPass === '' || userName === '' || codeConfirm === '') {
      return message.error('Todos los campos son obligatorios.')
    }
    setLoading(true)
    Auth.forgotPasswordSubmit(userName, codeConfirm, newPass)
      .then(result => {
        console.log('forgotPasswordSubmit', result)
        setIsModalResetVisible(false)
        setLoading(false)
        message.success('Tu contraseña se ha reiniciado.')
      })
      .catch(err => {
        setLoading(false)
        console.log(err)
        message.warning(
          'Verifica que todos los datos proporcionados sean correctos.'
        )
        if (err.message.indexOf('Attempt limit exceeded') > -1) {
          message.error(
            'Se ha excedido el numero de intentos, espera un momento y vuelve a intentarlo.'
          )
        }
      })
  }

  const confirmUser = async () => {
    setLoading(true)
    try {
      if (confirmUsername === '' || codeConfirm === '') {
        setLoading(false)
        return message.error('Usuario y codigo son obligatorios')
      }
      await Auth.confirmSignUp(confirmUsername, codeConfirm)
      setLoading(false)
      message.success('Cuenta Confirmada!')
      setIsModalConfirmVisible(false)
    } catch (error) {
      setLoading(false)
      console.log('error confirming sign up', error)
      message.warning(
        'No se ha podido confirmar su cuenta, verifica el usuario o el codigo.'
      )
    }
  }

  const cancelModal = () => {
    setLoading(false)
    setIsModalVisible(false)
    setIsModalConfirmVisible(false)
    setConfirmUsername('')
    setCodeConfirm('')
    setIsModalResetVisible(false)
  }

  const openNotification = () => {
    const key = `open${Date.now()}`
    const btn = (
      <Button
        type='primary'
        size='small'
        onClick={() => {
          setIsModalConfirmVisible(true)
          notification.close(key)
        }}
      >
        Confirmar cuenta
      </Button>
    )
    notification.open({
      message: 'Confirmar cuenta',
      description:
        'Se ha enviado el codigo de confirmacion a tu correo electronico.',
      btn,
      key,
    })
  }

  const openNotificationResetPassword = username => {
    const key = `open${Date.now()}`
    const btn = (
      <Button
        type='primary'
        size='small'
        onClick={() => {
          forgotPassword(username)
          notification.close(key)
        }}
      >
        Aceptar
      </Button>
    )
    notification.open({
      message: 'Resetear contraseña',
      description:
        'Se enviara un codigo de seguridad a tu correo electronico para resetear tu contraseña.',
      btn,
      key,
    })
  }

  return (
    <Row
      type='flex'
      justify='center'
      align='middle'
      className={'login-row-container'}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          src={process.env.PUBLIC_URL + '/cabisa-logo.png'}
          className={'login-logo-lg'}
          alt={'moocho'}
        />

        <div className={'login-container'}>
          <Form
            name='login-form'
            onFinish={handleSubmit}
            onFinishFailed={onFinishFailed}
            style={{ width: '400px' }}
            labelAlign={'left'}
            labelCol={{ xs: 24, sm: 24, md: 24, lg: 24 }}
            wrapperCol={{ xs: 24, sm: 24, md: 24, lg: 24 }}
            colon={false}
          >
            <Form.Item
              style={{ textAlign: 'left' }}
              label='Usuario'
              name='username'
              rules={[
                {
                  message: 'Ingresa un username valido',
                  type: 'string',
                },
              ]}
            >
              <Input placeholder={'Escribe tu usuario'} size={'large'} />
            </Form.Item>
            <Form.Item
              style={{ textAlign: 'left' }}
              label='Contraseña'
              name='password'
            >
              <Input.Password
                placeholder={'Escribe tu contraseña'}
                size={'large'}
              />
            </Form.Item>

            <div
              className={'login-button-container'}
              style={{ paddingBottom: '25px' }}
            >
              <Button type={'link'} className={'login-btn-link'}>
                ¿No recuerdas tu contraseña? Contacta con el administrador de tu
                cuenta
              </Button>
            </div>
            <div className={'login-button-container'}>
              <Form.Item>
                <Button
                  style={{ width: '200px' }}
                  className='bottom-login login-btn'
                  disabled={loading}
                  loading={loading}
                  type='primary'
                  htmlType='submit'
                >
                  Iniciar sesion
                </Button>
              </Form.Item>
              <span className={'login-btn-link title-space-top'}>
                V - {process.env.REACT_APP_VERSION}
              </span>
            </div>
          </Form>
        </div>
      </div>

      <Modal
        title='Ingresa tu nueva contraseña'
        visible={isModalVisible}
        onOk={completeNewPassword}
        onCancel={cancelModal}
      >
        <Row gutter={16} className={'section-space-field'}>
          <Col xs={12} sm={12} md={12} lg={12}>
            <Input.Password
              placeholder={'Ingrese Nueva contraseña'}
              value={newPass}
              onChange={value => setNewPass(value.target.value)}
            />
          </Col>
          <Col xs={12} sm={12} md={12} lg={12}>
            <Input.Password
              type={'password'}
              placeholder={'Confirmar contraseña'}
              value={confirmPass}
              onChange={value => setConfirmPass(value.target.value)}
            />
          </Col>
        </Row>
      </Modal>

      <Modal
        title='Confirma tu cuenta'
        visible={isModalConfirmVisible}
        onOk={confirmUser}
        onCancel={cancelModal}
      >
        <Spin spinning={loading}>
          <Row gutter={16} className={'section-space-field'}>
            <Col xs={12} sm={12} md={12} lg={12}>
              <Input
                placeholder={'Ingrese usuario'}
                value={confirmUsername}
                onChange={value => setConfirmUsername(value.target.value)}
              />
            </Col>
            <Col xs={12} sm={12} md={12} lg={12}>
              <Input
                placeholder={'Ingrese codigo'}
                value={codeConfirm}
                onChange={value => setCodeConfirm(value.target.value)}
              />
            </Col>
          </Row>
        </Spin>
      </Modal>
      <Modal
        title='Resetear contraseña'
        visible={isModalResetVisible}
        onOk={forgotPasswordSubmit}
        onCancel={cancelModal}
        width={575}
      >
        <Spin spinning={loading}>
          <Row gutter={16} className={'section-space-field'}>
            <Col xs={8} sm={8} md={8} lg={8}>
              <Input
                placeholder={'Ingrese codigo'}
                value={codeConfirm}
                onChange={value => setCodeConfirm(value.target.value)}
              />
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <Input
                placeholder={'Ingrese usuario'}
                value={confirmUsername}
                onChange={value => setConfirmUsername(value.target.value)}
              />
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <Input.Password
                placeholder={'Nueva contraseña'}
                value={newPass}
                onChange={value => setNewPass(value.target.value)}
              />
            </Col>
          </Row>
        </Spin>
      </Modal>
    </Row>
  )
}
export default Login
