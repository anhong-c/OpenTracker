import { MetricConfig } from './types';

/**
 * 验证指标数据的有效性
 */
export function isValidMetricValue(value: any): boolean {
  return value !== null && 
         value !== undefined && 
         typeof value === 'number' && 
         isFinite(value) && 
         value >= 0;
}

/**
 * 处理指标数值（范围限制和精度控制）
 */
export function processMetricValue(
  value: number, 
  maxValue: number, 
  precision: number
): number {
  if (!isValidMetricValue(value)) {
    throw new Error(`无效的指标数值: ${value}`);
  }

  let processedValue = value;
  
  // 限制最大值
  if (maxValue > 0) {
    processedValue = Math.min(processedValue, maxValue);
  }
  
  // 精度处理
  if (precision >= 0) {
    processedValue = Number(processedValue.toFixed(precision));
  }

  return processedValue;
}

/**
 * 检查浏览器 API 支持情况
 */
export function isPerformanceAPISupported(): boolean {
  return 'performance' in window && 'timing' in performance;
}

/**
 * 检查 PerformanceObserver 支持情况
 */
export function isPerformanceObserverSupported(): boolean {
  return 'PerformanceObserver' in window;
}

/**
 * 安全地执行 PerformanceObserver 观察
 */
export function safeObserve(
  observer: PerformanceObserver, 
  options: PerformanceObserverInit
): boolean {
  try {
    observer.observe(options);
    return true;
  } catch (error) {
    console.warn('PerformanceObserver 观察失败:', error);
    return false;
  }
}

/**
 * 获取性能时序数据
 */
export function getPerformanceTiming(): PerformanceTiming | null {
  return isPerformanceAPISupported() ? performance.timing : null;
}

/**
 * 格式化指标日志
 */
export function formatMetricLog(
  type: string, 
  oldValue: number | null, 
  newValue: number, 
  unit: string = ''
): string {
  return `[性能指标] ${type}: ${oldValue ?? '无'}${oldValue !== null ? unit : ''} → ${newValue}${unit}`;
}
