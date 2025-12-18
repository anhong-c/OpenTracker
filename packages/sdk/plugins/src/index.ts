// 导出性能监控相关功能
export * from './performance'

// 导出行为监控功能
export { default as UserVitals } from './behavior/index.js'

// 导出错误监控功能
export { initJsErrorMonitoring } from './error/js-error/js-monitoring.js'
export { ApiErrorMonitor } from './error/api-error/api-monitoring.js'
