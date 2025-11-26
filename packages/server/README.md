## 服务器信息

- 地址: http://123.57.81.94
- 环境: 开发环境
- 认证方式: JWT Token

## 认证流程

1. 注册/登录 → 获取 Token
2. 后续请求 → 在 Header 中添加：`Authorization: Bearer <your_token>`

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
"username": "user"
},
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"expiresIn": "7d"
},
"timestamp": "2025-11-20T00:00:00.000Z"
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
"username": "user"
},
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"expiresIn": "7d"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 4. 获取用户信息

GET /api/profile
请求头：
{
Authorization: Bearer <your_token>
}

响应示例：
{
"code": 200,
"message": "获取个人信息成功",
"data": {
"user": {
"id": "1",
"username": "user"
},
"message": "这是一个受 Token 保护的接口"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 4. 更新用户信息

GET /api/profile
请求头：
{
Authorization: Bearer <your_token>
}

响应示例：
{
"code": 200,
"message": "更新个人信息成功",
"data": {
"user": {
"id": "1",
"username": "user"
},
"updatedAt": "2025-11-20T00:00:00.000Z"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}
