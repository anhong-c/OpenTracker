import { useState, useEffect } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import type { Rule } from 'antd/es/form'
import { authAPI } from '@/api/auth'

const Register = () => {
  // 表单实例
  const [form] = Form.useForm()
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 提示信息状态
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 提示自动消失（3秒）
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [successMsg, errorMsg])

  // 清除提示
  const clearMsg = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  // 注册逻辑
  const handleRegister = async (values: { username: string; password: string }) => {
    const { username, password } = values
    clearMsg()

    setLoading(true)
    try {
      // 调用注册API
      const response = await authAPI.register(username, password)

      if (response.code === 200) {
        // 注册成功
        setSuccessMsg('注册成功！即将跳转到登录页面')
        // 重置表单
        form.resetFields()
        // 2秒后跳转到登录页面
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        // 注册失败
        setErrorMsg(response.message || '注册失败')
      }
    } catch (err: any) {
      console.error('注册失败：', err)
      // 处理409错误（用户名已存在）
      if (err.response?.status === 409) {
        setErrorMsg('用户名已存在，请选择其他用户名')
      } else {
        // 检查是否有服务器返回的具体错误消息
        const serverMessage = err.response?.data?.message
        setErrorMsg(serverMessage || '注册失败，请检查网络连接或稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 350, margin: '20px auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>用户注册</h2>

      {/* 成功提示 */}
      {successMsg && (
        <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16 }} />
      )}

      {/* 错误提示 */}
      {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

      {/* Ant Design 表单 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleRegister}
        initialValues={{ username: '', password: '' }}
        // 输入时清空提示
        onValuesChange={() => clearMsg()}
      >
        {/* 用户名输入框 */}
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' } as Rule]}
        >
          <Input placeholder="请输入用户名" disabled={loading} />
        </Form.Item>

        {/* 密码输入框 */}
        <Form.Item
          label="密码"
          name="password"
          rules={
            [
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ] as Rule[]
          }
        >
          <Input.Password placeholder="请输入密码（不少于6位）" disabled={loading} />
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item>
          <Button type="primary" block loading={loading} htmlType="submit">
            {loading ? '注册中...' : '立即注册'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Register
