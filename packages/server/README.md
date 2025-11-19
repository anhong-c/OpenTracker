## 服务器信息

- 地址: http://123.57.81.94
- 环境: 开发环境

## 接口列表

### 1. 健康检查

GET /health
GET /

### 2. 用户注册

POST /api/auth/register
请求体:
{
"username": "user",
"password": "123456"
}

响应示例:
{
"code": 200,
"message": "注册成功",
"data": {
"user": {
"id": "2",
"username": "user",
}
}
}

### 3. 用户登录

POST /api/auth/login
请求体:
{
"login": "user",
"password": "123456"
}

响应示例:
{
"code": 200,
"message": "登录成功",
"data": {
"user": {
"id": "1",
"username": "user",
}
}
}
