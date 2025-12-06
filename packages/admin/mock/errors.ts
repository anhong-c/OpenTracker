import type { ErrorItem } from '../src/types/error'

// Mock 错误数据
export const mockErrors: ErrorItem[] = [
  {
    id: '1',
    type: 'js',
    message: 'Cannot read property "length" of undefined',
    url: 'https://example.com/products',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-12-01 10:23:45',
    userId: 'user_001',
    status: 'unresolved',
    stack:
      'TypeError: Cannot read property "length" of undefined\n    at ProductList.render (ProductList.js:45:12)',
  },
  {
    id: '2',
    type: 'api',
    message: 'Request failed with status code 500',
    url: 'https://example.com/api/orders',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-12-02 11:45:12',
    userId: 'user_002',
    status: 'unresolved',
    statusCode: 500,
    method: 'POST',
  },
  {
    id: '3',
    type: 'behavior',
    message: '用户连续点击按钮超过10次',
    url: 'https://example.com/payment',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-12-03 12:10:05',
    userId: 'user_003',
    status: 'unresolved',
  },
  {
    id: '4',
    type: 'cors',
    message: 'Access to fetch at blocked by CORS policy',
    url: 'https://example.com/api/external',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-12-04 13:25:40',
    userId: 'user_004',
    status: 'unresolved',
  },
]
