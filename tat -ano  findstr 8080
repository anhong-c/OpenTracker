import { reportError } from './error-reporter'

export const initJsErrorMonitoring = () => {
  // 全局 JS 错误
  window.onerror = (message, source, lineno, colno, error) => {
    reportError({
      type: 'js-error',
      message: typeof message === 'string' ? message : String(message), // 确保 message 是 string 类型
      source: source || '',
      lineno: lineno || 0,
      colno: colno || 0,
      stack: error instanceof Error ? error.stack || '' : '', // 如果 error 是 Error 对象，获取 stack
    })
    return true // 返回 true 防止浏览器默认处理
  }

  // Promise 未捕获错误
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    reportError({
      type: 'unhandled-rejection',
      message: reason instanceof Error ? reason.message : String(reason), // 如果 reason 是 Error 对象，获取 message
      source: '',
      lineno: 0,
      colno: 0,
      stack: reason instanceof Error ? reason.stack || '' : '', // 如果 reason 是 Error 对象，获取 stack
    })
  })
}
