import { TrackEvent, RetryConfig } from '../../../types/src/core/config';
import { Transport } from './transport';

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxTimes: 3,       // 最多重试3次
  baseDelay: 1000,   // 基础延迟1秒
};

export class Retryer {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  //
  public retry(
    transport: Transport,
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    currentCount = 0
  ): void {
    // 超过最大重试次数，放弃上报
    if (currentCount >= this.config.maxTimes) {
      console.error(`[Retryer] 重试${this.config.maxTimes}次失败，放弃上报${events.length}条事件`);
      return;
    }

    // 计算指数退避延迟时间
    const delay = this.config.baseDelay * Math.pow(2, currentCount);
    this.log(`第${currentCount + 1}次重试，延迟${delay}ms`);

    // 延迟后重新调用传输层上报
    setTimeout(() => {
      transport.send(events, isImmediate, isUnloading, currentCount + 1);
    }, delay);
  }

  // 重试日志打印
  private log(message: string): void {
    console.log(`[Retryer] ${message}`);
  }
}