import { onCLS, onINP, onLCP, Metric } from 'web-vitals';
import { CoreVitalsData, MetricConfig } from './types';
import { isValidMetricValue, processMetricValue, formatMetricLog } from './utils';

export class CoreVitalsCollector {
  private data: CoreVitalsData = {
    lcp: null,
    inp: null,
    cls: null
  };

  private isInitialized = false;

  // 指标配置
  private readonly config: Record<keyof CoreVitalsData, MetricConfig> = {
    lcp: { maxValue: 10000, precision: 2, isOneTime: true },
    inp: { maxValue: 2000, precision: 2, isOneTime: false },
    cls: { maxValue: 2, precision: 4, isOneTime: false }
  };

  constructor() {
    this.init();
  }

  /**
   * 初始化核心 Web Vitals 监听
   */
  private init(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;

    // 监听 LCP
    onLCP((metric: Metric) => {
      this.updateMetric('lcp', metric.value);
    });

    // 监听 INP
    onINP((metric: Metric) => {
      this.updateMetric('inp', metric.value);
    });

    // 监听 CLS
    onCLS((metric: Metric) => {
      this.updateMetric('cls', metric.value);
    });

    console.log('[CoreVitalsCollector] 核心 Web Vitals 监听已启动');
  }

  /**
   * 更新指标数据
   */
  private updateMetric(type: keyof CoreVitalsData, value: number): void {
    if (!isValidMetricValue(value)) {
      console.warn(`[CoreVitals] ${type} 数据无效:`, value);
      return;
    }

    const config = this.config[type];
    const processedValue = processMetricValue(value, config.maxValue, config.precision);
    
    const shouldUpdate = this.shouldUpdateMetric(type, processedValue, config.isOneTime);
    
    if (shouldUpdate) {
      const oldValue = this.data[type];
      this.data[type] = processedValue;
      
      const unit = type === 'cls' ? '' : 'ms';
      console.log(formatMetricLog(type, oldValue, processedValue, unit));
    }
  }

  /**
   * 决定是否更新指标
   */
  private shouldUpdateMetric(
    type: keyof CoreVitalsData, 
    newValue: number, 
    isOneTime: boolean
  ): boolean {
    const currentValue = this.data[type];
    
    if (isOneTime) {
      // 一次性指标：只记录第一次有效值
      return currentValue === null;
    }
    
    // CLS 特殊处理：累积更新，取最大值
    if (type === 'cls') {
      return currentValue === null || newValue > currentValue;
    }
    
    // INP：总是更新
    return true;
  }

  /**
   * 获取当前核心 Web Vitals 数据
   */
  public getData(): CoreVitalsData {
    return { ...this.data };
  }

  /**
   * 重置核心 Web Vitals 数据
   */
  public reset(): void {
    this.data = {
      lcp: null,
      inp: null,
      cls: null
    };
    console.log('[CoreVitalsCollector] 数据已重置');
  }
}
