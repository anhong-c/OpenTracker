// 核心 Web Vitals 数据类型
export interface CoreVitalsData {
  lcp: number | null;  // 最大内容绘制时间
  inp: number | null;  // 交互到下一次绘制时间
  cls: number | null;  // 累积布局偏移
}

// 加载性能数据类型
export interface LoadingPerformanceData {
  ttfb: number | null;  // 首字节时间
  fp: number | null;    // 首次绘制时间
  fcp: number | null;   // 首次内容绘制时间
  dcl: number | null;   // DOMContentLoaded 时间
  load: number | null;  // 页面完全加载时间
}

// 网络性能数据类型
export interface NetworkPerformanceData {
  dns: number | null;  // DNS 查询耗时
  tcp: number | null;  // TCP 连接耗时
}

// 运行时性能数据类型
export interface RuntimePerformanceData {
  longTask: number | null;     // 长任务数量
  fps: number | null;          // 帧率
  resourceLoad: number | null; // 资源加载平均耗时
}

// 完整性能数据类型
export interface PerformanceData {
  coreVitals: CoreVitalsData;
  loadingPerformance: LoadingPerformanceData;
  networkPerformance: NetworkPerformanceData;
  runtimePerformance: RuntimePerformanceData;
}

// 上报数据类型
export interface ReportData {
  performanceData: PerformanceData;
  timestamp: number;
  pageURL: string;
  userAgent: string;
}

// 指标配置类型
export interface MetricConfig {
  maxValue: number;
  precision: number;
  isOneTime: boolean;
}

// 性能指标配置映射
export type MetricConfigMap = {
  [K in keyof PerformanceData]: {
    [P in keyof PerformanceData[K]]: MetricConfig;
  };
};
