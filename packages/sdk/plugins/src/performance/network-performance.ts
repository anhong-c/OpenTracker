import { NetworkPerformanceData, MetricConfig } from './types';
import { 
  isValidMetricValue, 
  processMetricValue, 
  formatMetricLog, 
  isPerformanceAPISupported,
  getPerformanceTiming
} from './utils';

export class NetworkPerformanceCollector {
  private data: NetworkPerformanceData = {
    dns: null,
    tcp: null
  };

  private isInitialized = false;

  // 指标配置
  private readonly config: Record<keyof NetworkPerformanceData, MetricConfig> = {
    dns: { maxValue: 10000, precision: 2, isOneTime: true },
    tcp: { maxValue: 10000, precision: 2, isOneTime: true }
  };

  constructor() {
    this.init();
  }

  /**
   * 初始化网络性能指标收集
   */
  private init(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;

    this.collectNetworkTimingData();
    console.log('[NetworkPerformanceCollector] 网络性能指标监听已启动');
  }

  /**
   * 收集网络时序数据
   */
  private collectNetworkTimingData(): void {
    const timing = getPerformanceTiming();
    
    if (!timing) {
      console.warn('[NetworkPerformance] Performance Timing API 不支持');
      return;
    }

    // DNS 查询时间
    const dns = timing.domainLookupEnd - timing.domainLookupStart;
    this.updateMetric('dns', dns);

    // TCP 连接时间
    const tcp = timing.connectEnd - timing.connectStart;
    this.updateMetric('tcp', tcp);
  }

  /**
   * 更新指标数据
   */
  private updateMetric(type: keyof NetworkPerformanceData, value: number): void {
    if (!isValidMetricValue(value)) {
      console.warn(`[NetworkPerformance] ${type} 数据无效:`, value);
      return;
    }

    const config = this.config[type];
    const processedValue = processMetricValue(value, config.maxValue, config.precision);
    
    // 网络性能指标都是一次性的，只在没有值时更新
    if (this.data[type] === null) {
      const oldValue = this.data[type];
      this.data[type] = processedValue;
      console.log(formatMetricLog(type, oldValue, processedValue, 'ms'));
    }
  }

  /**
   * 获取当前网络性能数据
   */
  public getData(): NetworkPerformanceData {
    return { ...this.data };
  }

  /**
   * 重置网络性能数据
   */
  public reset(): void {
    this.data = {
      dns: null,
      tcp: null
    };
    console.log('[NetworkPerformanceCollector] 数据已重置');
  }
}
