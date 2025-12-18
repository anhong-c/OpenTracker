import { LoadingPerformanceData, MetricConfig } from './types';
import { 
  isValidMetricValue, 
  processMetricValue, 
  formatMetricLog, 
  isPerformanceAPISupported,
  isPerformanceObserverSupported,
  safeObserve,
  getPerformanceTiming
} from './utils';

export class LoadingPerformanceCollector {
  private data: LoadingPerformanceData = {
    ttfb: null,
    fp: null,
    fcp: null,
    dcl: null,
    load: null
  };

  private isInitialized = false;

  // 指标配置
  private readonly config: Record<keyof LoadingPerformanceData, MetricConfig> = {
    ttfb: { maxValue: 60000, precision: 2, isOneTime: true },
    fp: { maxValue: 10000, precision: 2, isOneTime: true },
    fcp: { maxValue: 10000, precision: 2, isOneTime: true },
    dcl: { maxValue: 60000, precision: 2, isOneTime: true },
    load: { maxValue: 120000, precision: 2, isOneTime: true }
  };

  constructor() {
    this.init();
  }

  /**
   * 初始化加载性能指标收集
   */
  private init(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;

    // 收集 Performance Timing API 数据
    this.collectPerformanceTimingData();
    
    // 使用 PerformanceObserver 收集 FP 和 FCP
    this.collectPaintTimings();

    console.log('[LoadingPerformanceCollector] 加载性能指标监听已启动');
  }

  /**
   * 收集 Performance Timing API 数据
   */
  private collectPerformanceTimingData(): void {
    const timing = getPerformanceTiming();
    
    if (!timing) {
      console.warn('[LoadingPerformance] Performance Timing API 不支持');
      return;
    }

    // TTFB
    const ttfb = timing.responseStart - timing.requestStart;
    this.updateMetric('ttfb', ttfb);

    // DCL (DOMContentLoaded)
    const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
    this.updateMetric('dcl', dcl);

    // Load (页面完全加载)
    const load = timing.loadEventEnd - timing.navigationStart;
    this.updateMetric('load', load);
  }

  /**
   * 收集绘制时间指标 (FP, FCP)
   */
  private collectPaintTimings(): void {
    if (!isPerformanceObserverSupported()) {
      console.warn('[LoadingPerformance] PerformanceObserver 不支持');
      return;
    }

    const paintObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-paint' && this.data.fp === null) {
          this.updateMetric('fp', entry.startTime);
        }
        if (entry.name === 'first-contentful-paint' && this.data.fcp === null) {
          this.updateMetric('fcp', entry.startTime);
        }
      });
    });

    safeObserve(paintObserver, { entryTypes: ['paint'] });
  }

  /**
   * 更新指标数据
   */
  private updateMetric(type: keyof LoadingPerformanceData, value: number): void {
    if (!isValidMetricValue(value)) {
      console.warn(`[LoadingPerformance] ${type} 数据无效:`, value);
      return;
    }

    const config = this.config[type];
    const processedValue = processMetricValue(value, config.maxValue, config.precision);
    
    // 加载性能指标都是一次性的，只在没有值时更新
    if (this.data[type] === null) {
      const oldValue = this.data[type];
      this.data[type] = processedValue;
      console.log(formatMetricLog(type, oldValue, processedValue, 'ms'));
    }
  }

  /**
   * 获取当前加载性能数据
   */
  public getData(): LoadingPerformanceData {
    return { ...this.data };
  }

  /**
   * 重置加载性能数据
   */
  public reset(): void {
    this.data = {
      ttfb: null,
      fp: null,
      fcp: null,
      dcl: null,
      load: null
    };
    console.log('[LoadingPerformanceCollector] 数据已重置');
  }
}
