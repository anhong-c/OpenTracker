import { RuntimePerformanceData, MetricConfig } from './types';
import { 
  isValidMetricValue, 
  processMetricValue, 
  formatMetricLog, 
  isPerformanceObserverSupported,
  safeObserve
} from './utils';

export class RuntimePerformanceCollector {
  private data: RuntimePerformanceData = {
    longTask: null,
    fps: null,
    resourceLoad: null
  };

  private isInitialized = false;
  private longTaskCount = 0;
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private resourceLoadTimes: number[] = [];

  // 指标配置
  private readonly config: Record<keyof RuntimePerformanceData, MetricConfig> = {
    longTask: { maxValue: 1000, precision: 0, isOneTime: false },
    fps: { maxValue: 120, precision: 0, isOneTime: false },
    resourceLoad: { maxValue: 10000, precision: 2, isOneTime: false }
  };

  constructor() {
    this.init();
  }

  /**
   * 初始化运行时性能指标收集
   */
  private init(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;

    // 长任务监控
    this.initLongTaskMonitoring();
    
    // FPS 监控
    this.initFPSMonitoring();
    
    // 资源加载监控
    this.initResourceMonitoring();

    console.log('[RuntimePerformanceCollector] 运行时性能指标监听已启动');
  }

  /**
   * 初始化长任务监控
   */
  private initLongTaskMonitoring(): void {
    if (!isPerformanceObserverSupported()) {
      console.warn('[RuntimePerformance] PerformanceObserver 不支持，无法监控长任务');
      return;
    }

    const longTaskObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      this.longTaskCount += entries.length;
      this.updateMetric('longTask', this.longTaskCount);
    });

    safeObserve(longTaskObserver, { entryTypes: ['longtask'] });
  }

  /**
   * 初始化 FPS 监控
   */
  private initFPSMonitoring(): void {
    const calculateFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.updateMetric('fps', this.fps);
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(calculateFPS);
    };
    
    requestAnimationFrame(calculateFPS);
  }

  /**
   * 初始化资源加载监控
   */
  private initResourceMonitoring(): void {
    if (!isPerformanceObserverSupported()) {
      console.warn('[RuntimePerformance] PerformanceObserver 不支持，无法监控资源加载');
      return;
    }

    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          
          if (isValidMetricValue(loadTime)) {
            this.resourceLoadTimes.push(loadTime);
            
            // 计算平均资源加载时间
            const avgLoadTime = this.resourceLoadTimes.reduce((a, b) => a + b, 0) / this.resourceLoadTimes.length;
            this.updateMetric('resourceLoad', avgLoadTime);
          }
        }
      });
    });

    safeObserve(resourceObserver, { entryTypes: ['resource'] });
  }

  /**
   * 更新指标数据
   */
  private updateMetric(type: keyof RuntimePerformanceData, value: number): void {
    if (!isValidMetricValue(value)) {
      return;
    }

    const config = this.config[type];
    const processedValue = processMetricValue(value, config.maxValue, config.precision);
    
    const oldValue = this.data[type];
    this.data[type] = processedValue;
    
    const unit = type === 'fps' ? 'fps' : 'ms';
    console.log(formatMetricLog(type, oldValue, processedValue, unit));
  }

  /**
   * 获取当前运行时性能数据
   */
  public getData(): RuntimePerformanceData {
    return { ...this.data };
  }

  /**
   * 重置运行时性能数据
   */
  public reset(): void {
    this.data = {
      longTask: null,
      fps: null,
      resourceLoad: null
    };
    
    this.longTaskCount = 0;
    this.resourceLoadTimes = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    
    console.log('[RuntimePerformanceCollector] 数据已重置');
  }
}
