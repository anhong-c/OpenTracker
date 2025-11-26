# OpenTracker Admin Panel

## 技术栈

- **前端框架**：React
- **构建工具**：Vite
- **UI组件库**：Ant Design
- **状态管理**：React Context API
- **类型系统**：TypeScript
- **路由**：React Router

## 运行

- 在admin根目录运行pnpm dev

### 前置要求

- Node.js >= 16.x
- npm >= 8.x 或 pnpm >= 7.x

## 项目结构

```
packages/admin/
├── src/                   # 源代码目录
│   ├── api/               # API 接口定义
│   ├── components/        # 公共组件
│   │   ├── header.tsx     # 头部导航栏组件
│   │   └── sider.tsx      # 侧边栏导航组件
│   ├── screens/           # 页面组件
│   │   ├── behavior/      # 行为分析页面
│   │   ├── blank/         # 白屏监控页面
│   │   ├── customer/      # 获客分析页面
│   │   ├── dashboard/     # 报表面板页面
│   │   ├── error/         # 错误分析页面
│   │   ├── performance/   # 性能分析页面
│   │   └── visitor/       # 访客分析页面
│   ├── types/             # TypeScript 类型定义
│   ├── unauthenticated-app/  # 未登录页面
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 应用主组件
│   ├── authenticated-app.tsx  # 登陆后首页
│   └── index.tsx          # 应用入口文件
├── mock/                  # 模拟数据
├── public/                # 静态资源
├── index.html             # HTML 入口
├── package.json           # 项目依赖配置
├── tsconfig.json          # TypeScript 配置
└── vite.config.ts         # Vite 配置
```
