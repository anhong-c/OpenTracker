import { CoreVitalsCollector } from './core-vitals';
import { LoadingPerformanceCollector } from './loading-performance';
import { NetworkPerformanceCollector } from './network-performance';
import { RuntimePerformanceCollector } from './runtime-performance';
import { PerformanceData, ReportData } from './types';

/**
 * 性能指标收集器主类
 * 整合所有子收集器，提供统一接口
 */
export class PerformanceCollector {
  private coreVitalsCollector: CoreVitalsCollector;
  private loadingPerformanceCollector: LoadingPerformanceCollector;
  private networkPerformanceCollector: NetworkPerformanceCollector;
  private runtimePerformanceCollector: RuntimePerformanceCollector;

  private isInitialized = false;

  constructor() {
    this.coreVitalsCollector = new CoreVitalsCollector();
    this.loadingPerformanceCollector = new LoadingPerformanceCollector();
    this.networkPerformanceCollector = new NetworkPerformanceCollector();
    this.runtimePerformanceCollector = new RuntimePerformanceCollector();
    
    this.isInitialized = true;
  }

  /**
   * 获取完整的性能数据
   */
  public getPerformanceData(): PerformanceData {
    return {
      coreVitals: this.coreVitalsCollector.getData(),
      loadingPerformance: this.loadingPerformanceCollector.getData(),
      networkPerformance: this.networkPerformanceCollector.getData(),
      runtimePerformance: this.runtimePerformanceCollector.getData()
    };
  }

  /**
   * 获取上报格式数据
   */
  public getReportData(): ReportData {
    return {
      performanceData: this.getPerformanceData(),
      timestamp: Date.now(),
      pageURL: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * 重置所有性能数据
   */
  public resetAllData(): void {
    this.coreVitalsCollector.reset();
    this.loadingPerformanceCollector.reset();
    this.networkPerformanceCollector.reset();
    this.runtimePerformanceCollector.reset();
    
  }

  /**
   * 检查收集器是否已初始化
   */
  public isCollectorInitialized(): boolean {
    return this.isInitialized;
  }
}

// 导出单例实例
export const performanceCollector = new PerformanceCollector();

// 导出各个子收集器（按需使用）
export { 
  CoreVitalsCollector, 
  LoadingPerformanceCollector, 
  NetworkPerformanceCollector, 
  RuntimePerformanceCollector 
};
