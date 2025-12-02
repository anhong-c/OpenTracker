export interface JsErrorInfo {
  type: string
  message: string
  source: string
  lineno: number
  colno: number
  stack: string
}
export class JsErrorReporter {
  private serverUrl: string
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }
  public async report(data: JsErrorInfo): Promise<void> {
    if (!this.serverUrl) {
      console.warn('JS错误上报失败：serverUrl未配置')
      return
    }
    try {
      const response = await fetch(`${this.serverUrl}/js-errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      })
      if (!response.ok) {
        console.warn('JS错误上报失败：', response.statusText)
      }
    } catch (error) {
      console.warn('JS错误上报失败：', error)
    }
  }
}
