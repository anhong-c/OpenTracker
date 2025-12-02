import { TrackEvent, TransportConfig } from '../../../types/src/core/config'
import { ReportStrategy } from '../../../common'
import { Retryer } from './retry'

// 通过sendBeacon上报：页面卸载优先，无阻塞，支持跨域
const reportByBeacon = (serverUrl: string, events: TrackEvent[]): boolean => {
  try {
    const payload = JSON.stringify({
      events,
      timestamp: Date.now(),
      apiKey: events[0]?.data?._apiKey || '', // 携带项目ID
    })
    const blob = new Blob([payload], { type: 'application/json; charset=utf-8' })
    // sendBeacon返回布尔值，表示是否成功加入浏览器发送队列
    return navigator.sendBeacon(serverUrl, blob)
  } catch (error) {
    console.error(`[Transports:Beacon] 上报异常：${(error as Error).message}`)
    return false
  }
}

// 通过XHR上报：可控性强，支持复杂数据和重试，支持跨域
const reportByXHR = (serverUrl: string, events: TrackEvent[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', serverUrl, true)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')

    // 上报成功回调
    xhr.onload = () => {
      resolve(xhr.status >= 200 && xhr.status < 300)
    }

    // 网络异常回调
    xhr.onerror = () => {
      resolve(false)
    }

    // 发送数据
    xhr.send(
      JSON.stringify({
        events,
        timestamp: Date.now(),
        apiKey: events[0]?.data?._apiKey || '',
      })
    )
  })
}

// 通过IMG标签上报：跨域友好，适合大数据量批量上报，支持跨域
const reportByIMG = (serverUrl: string, events: TrackEvent[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // IMG仅支持GET，需将数据转成URL参数
      const payload = encodeURIComponent(
        JSON.stringify({
          events,
          timestamp: Date.now(),
          apiKey: events[0]?.data?._apiKey || '',
        })
      )
      const img = new Image()

      // 上报成功
      img.onload = () => {
        resolve(true)
      }

      // 上报失败
      img.onerror = () => {
        resolve(false)
      }

      // 触发上报
      img.src = `${serverUrl}?data=${payload}`
    } catch (error) {
      console.error(`[Transports:IMG] 上报异常：${(error as Error).message}`)
      resolve(false)
    }
  })
}

//  传输策略核心类
export class Transport {
  private serverUrl: string // 上报地址
  private debug: boolean // 调试模式
  private retryer: Retryer // 重试器实例
  constructor(config: TransportConfig) {
    this.serverUrl = config.serverUrl
    this.debug = config.debug || false
    this.retryer = new Retryer() // 初始化重试器
    this.log('传输层初始化成功')
  }

  // 根据事件数和页面状态选择上报策略
  private selectStrategy(
    isImmediate: boolean,
    isUnloading: boolean,
    eventCount: number
  ): ReportStrategy {
    if (isUnloading || isImmediate) {
      // 页面卸载/立即上报：优先Beacon（浏览器支持的话）
      return 'sendBeacon' in navigator ? ReportStrategy.BEACON : ReportStrategy.XHR
    }
    // 批量上报：根据事件数选择IMG/XHR
    return eventCount > 15 ? ReportStrategy.IMG : ReportStrategy.XHR
  }

  // 核心发送方法：选择策略并执行上报，失败后触发重试
  public send(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): void {
    const strategy = this.selectStrategy(isImmediate, isUnloading, events.length)
    this.log(`选择上报策略：${strategy}，待上报事件数：${events.length}`)

    // 根据策略执行上报
    switch (strategy) {
      case ReportStrategy.BEACON:
        this.handleBeacon(events, isImmediate, isUnloading, retryCount)
        break
      case ReportStrategy.XHR:
        this.handleXHR(events, isImmediate, isUnloading, retryCount)
        break
      case ReportStrategy.IMG:
        this.handleIMG(events, isImmediate, isUnloading, retryCount)
        break
    }
  }

  // 处理Beacon上报：失败后触发重试
  private handleBeacon(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): void {
    const success = reportByBeacon(this.serverUrl, events)
    if (success) {
      this.log('Beacon上报成功')
    } else {
      this.log('Beacon上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 处理XHR上报：失败后触发重试
  private async handleXHR(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): Promise<void> {
    const success = await reportByXHR(this.serverUrl, events)
    if (success) {
      this.log('XHR上报成功')
    } else {
      this.log('XHR上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 处理IMG上报：失败后触发重试
  private async handleIMG(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): Promise<void> {
    const success = await reportByIMG(this.serverUrl, events)
    if (success) {
      this.log('IMG上报成功')
    } else {
      this.log('IMG上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 传输层日志打印
  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.debug) {
      console[level](`[Transport] ${message}`)
    }
  }
}
