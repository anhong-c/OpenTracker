import Router from '@koa/router'
import authController from '../controllers/authController'

const router = new Router()

// 用户注册
router.post('/api/auth/register', authController.register)

// 用户登录
router.post('/api/auth/login', authController.login)

export default router
