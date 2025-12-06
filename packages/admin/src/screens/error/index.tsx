import React, { useState, useMemo, useEffect } from 'react'
import {
  Row,
  Col,
  Input,
  Card,
  Space,
  Button,
  Tabs,
  Table,
  Tag,
  Tooltip,
  Typography,
  Drawer,
  Descriptions,
  Segmented,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  BugOutlined, // JS错误图标
  ApiOutlined, // API错误图标
  UserOutlined, // 行为异常图标
  CloseCircleOutlined, // 总错误图标
  EyeOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { ErrorItem, ErrorType } from '../../types/error'
import { mockErrors } from '../../../mock/errors'

const { Text, Paragraph } = Typography

// 生成从指定日期到今天的日期数组
const generateDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// 时间粒度类型
type TimeGranularity = 'day' | 'month' | 'year'

// 生成 ECharts 折线图数据
const generateEChartsOption = (errors: ErrorItem[], granularity: TimeGranularity = 'day') => {
  // 固定从 2025-12-01 开始到当前日期
  const startDate = new Date('2025-12-01')
  const endDate = new Date() // 今天

  // 根据粒度生成时间范围
  const timeKeys: string[] = []
  const timeKeyMap: Record<string, string> = {} // 用于格式化显示

  if (granularity === 'day') {
    const dateRange = generateDateRange(startDate, endDate)
    dateRange.forEach((date) => {
      const d = new Date(date)
      const key = date
      timeKeys.push(key)
      timeKeyMap[key] = `${d.getMonth() + 1}/${d.getDate()}`
    })
  } else if (granularity === 'month') {
    const current = new Date(startDate)
    current.setDate(1) // 设置为月初，避免日期问题
    const endMonth = new Date(endDate)
    endMonth.setDate(1) // 设置为月初

    while (current <= endMonth) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      if (!timeKeys.includes(key)) {
        timeKeys.push(key)
        timeKeyMap[key] =
          `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      }
      current.setMonth(current.getMonth() + 1)
    }
  } else if (granularity === 'year') {
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    for (let year = startYear; year <= endYear; year++) {
      const key = String(year)
      timeKeys.push(key)
      timeKeyMap[key] = String(year)
    }
  }

  // 按时间粒度和错误类型统计，同时统计状态
  const errorStats: Record<
    string,
    Record<string, { count: number; resolved: number; unresolved: number }>
  > = {}

  timeKeys.forEach((key) => {
    errorStats[key] = {
      js: { count: 0, resolved: 0, unresolved: 0 },
      api: { count: 0, resolved: 0, unresolved: 0 },
      behavior: { count: 0, resolved: 0, unresolved: 0 },
      cors: { count: 0, resolved: 0, unresolved: 0 },
    }
  })

  // 统计错误数量和状态
  errors.forEach((error) => {
    let timeKey = ''

    if (granularity === 'day') {
      timeKey = error.timestamp.split(' ')[0] // YYYY-MM-DD
    } else if (granularity === 'month') {
      // 直接从 timestamp 字符串提取年月，避免 Date 解析问题
      const datePart = error.timestamp.split(' ')[0] // YYYY-MM-DD
      timeKey = datePart.substring(0, 7) // YYYY-MM
    } else if (granularity === 'year') {
      const datePart = error.timestamp.split(' ')[0] // YYYY-MM-DD
      timeKey = datePart.substring(0, 4) // YYYY
    }

    // 确保 timeKey 存在于 errorStats 中
    if (!errorStats[timeKey]) {
      // 如果时间 key 不在预生成的列表中，跳过（通常不应该发生）
      console.warn(
        `时间 key ${timeKey} 不在预生成的列表中，错误类型: ${error.type}, timestamp: ${error.timestamp}`
      )
      return
    }

    // 确保错误类型存在
    if (errorStats[timeKey][error.type] !== undefined) {
      errorStats[timeKey][error.type].count++
      if (error.status === 'resolved') {
        errorStats[timeKey][error.type].resolved++
      } else {
        errorStats[timeKey][error.type].unresolved++
      }
    } else {
      console.warn(`错误类型 ${error.type} 不在统计列表中，时间 key: ${timeKey}`)
    }
  })

  // 转换为 ECharts 需要的格式
  const dates = timeKeys.map((key) => timeKeyMap[key])

  // 保存完整的数据信息，用于 tooltip
  const fullData: Record<
    string,
    Record<string, { value: number; resolved: number; unresolved: number }>
  > = {
    js: {},
    api: {},
    behavior: {},
    cors: {},
  }

  timeKeys.forEach((key, index) => {
    fullData.js[index] = {
      value: errorStats[key].js.count,
      resolved: errorStats[key].js.resolved,
      unresolved: errorStats[key].js.unresolved,
    }
    fullData.api[index] = {
      value: errorStats[key].api.count,
      resolved: errorStats[key].api.resolved,
      unresolved: errorStats[key].api.unresolved,
    }
    fullData.behavior[index] = {
      value: errorStats[key].behavior.count,
      resolved: errorStats[key].behavior.resolved,
      unresolved: errorStats[key].behavior.unresolved,
    }
    fullData.cors[index] = {
      value: errorStats[key].cors.count,
      resolved: errorStats[key].cors.resolved,
      unresolved: errorStats[key].cors.unresolved,
    }
  })

  // 转换为数字数组用于绘制折线
  const jsData = timeKeys.map((key) => errorStats[key].js.count)
  const apiData = timeKeys.map((key) => errorStats[key].api.count)
  const behaviorData = timeKeys.map((key) => errorStats[key].behavior.count)
  const corsData = timeKeys.map((key) => errorStats[key].cors.count)

  // 计算最大错误数，用于设置 y 轴范围
  const maxValue = Math.max(...jsData, ...apiData, ...behaviorData, ...corsData, 0)

  // 计算 y 轴最大值，使其是 5 的倍数，用于显示 0, 5, 10, 15... 这样的刻度
  const yMax = maxValue > 0 ? Math.ceil((maxValue * 1.2) / 5) * 5 : 10

  return {
    tooltip: {
      trigger: granularity === 'day' ? 'item' : 'axis',
      position:
        granularity === 'day'
          ? undefined
          : (point: any, params: any, dom: any, rect: any, size: any) => {
              // 按月/按年查看时，tooltip 位置往下移动一点
              return [point[0], point[1] + 10] // 往下移动 10px
            },
      confine: true, // 确保 tooltip 在图表区域内显示
      formatter: (params: any) => {
        if (!params) return ''

        // 按日查看：显示单个节点的详细信息
        if (granularity === 'day') {
          const dataIndex = params.dataIndex
          const typeName = params.seriesName
          const timeValue = params.axisValue || dates[dataIndex]

          // 根据系列名称获取对应的数据
          let typeKey = 'js'
          if (typeName === 'API错误') typeKey = 'api'
          else if (typeName === '行为异常') typeKey = 'behavior'
          else if (typeName === '跨域错误') typeKey = 'cors'

          const dataInfo = fullData[typeKey][dataIndex]

          let result = `<div style="margin-bottom: 6px; font-weight: bold; font-size: 14px;">${timeValue}</div>`
          result += `<div style="margin-bottom: 6px;">${params.marker}<strong style="font-size: 13px;">${typeName}</strong></div>`

          if (dataInfo) {
            result += `<div style="margin-left: 20px; margin-bottom: 3px;">类型: <strong>${typeName}</strong></div>`
            result += `<div style="margin-left: 20px; margin-bottom: 3px;">数量: <strong>${dataInfo.value}</strong> 条</div>`
            result += `<div style="margin-left: 20px; margin-bottom: 3px; color: #52c41a;">状态 - 已处理: <strong>${dataInfo.resolved}</strong> 条</div>`
            result += `<div style="margin-left: 20px; margin-bottom: 0px; color: #faad14;">状态 - 未处理: <strong>${dataInfo.unresolved}</strong> 条</div>`
          } else {
            result += `<div style="margin-left: 20px;">数量: <strong>${params.value}</strong> 条</div>`
          }

          return result
        } else {
          // 按月/按年查看：显示该时间点所有四种错误类型的数据
          if (!Array.isArray(params)) {
            params = [params]
          }

          const dataIndex = params[0].dataIndex
          const timeValue = params[0].axisValue || dates[dataIndex]

          let result = `<div style="margin-bottom: 8px; font-weight: bold; font-size: 12px;">${timeValue}</div>`

          // 显示所有四种错误类型的数据 - 横向布局
          const typeKeys = ['js', 'api', 'behavior', 'cors']
          const typeNames = ['JS错误', 'API错误', '行为异常', '跨域错误']
          const typeColors = ['#ff4d4f', '#ff9800', '#1890ff', '#722ed1']

          // 使用表格布局横向显示
          result += `<table style="border-collapse: collapse; width: 100%; font-size: 10px;">`

          // 表头：错误类型
          result += `<tr>`
          typeKeys.forEach((typeKey, index) => {
            const dataInfo = fullData[typeKey][dataIndex]
            if (dataInfo) {
              const marker = `<span style="display:inline-block;margin-right:3px;border-radius:50%;width:8px;height:8px;background-color:${typeColors[index]};vertical-align:middle;"></span>`
              result += `<td style="padding: 2px 6px; text-align: center; border-right: 1px solid #e8e8e8;">
                <div style="font-size: 10px; font-weight: bold;">${marker}${typeNames[index]}</div>
              </td>`
            }
          })
          result += `</tr>`

          // 数量行
          result += `<tr>`
          typeKeys.forEach((typeKey) => {
            const dataInfo = fullData[typeKey][dataIndex]
            if (dataInfo) {
              result += `<td style="padding: 2px 6px; text-align: center; border-right: 1px solid #e8e8e8;">
                <div style="font-size: 9px;">数量: <strong>${dataInfo.value}</strong></div>
              </td>`
            }
          })
          result += `</tr>`

          // 已处理行
          result += `<tr>`
          typeKeys.forEach((typeKey) => {
            const dataInfo = fullData[typeKey][dataIndex]
            if (dataInfo) {
              result += `<td style="padding: 2px 6px; text-align: center; border-right: 1px solid #e8e8e8;">
                <div style="font-size: 9px; color: #52c41a;">已处理: <strong>${dataInfo.resolved}</strong></div>
              </td>`
            }
          })
          result += `</tr>`

          // 未处理行
          result += `<tr>`
          typeKeys.forEach((typeKey) => {
            const dataInfo = fullData[typeKey][dataIndex]
            if (dataInfo) {
              result += `<td style="padding: 2px 6px; text-align: center; border-right: 1px solid #e8e8e8;">
                <div style="font-size: 9px; color: #faad14;">未处理: <strong>${dataInfo.unresolved}</strong></div>
              </td>`
            }
          })
          result += `</tr>`

          result += `</table>`

          return result
        }
      },
    },
    legend: {
      data: ['JS错误', 'API错误', '行为异常', '跨域错误'],
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: -45,
      },
    },
    yAxis: {
      type: 'value',
      name: '错误数量（条）',
      min: 0,
      max: yMax,
      interval: 5, // 固定间隔为 5，显示 0, 5, 10, 15...
    },
    series: [
      {
        name: 'JS错误',
        type: 'line',
        data: jsData,
        smooth: false,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: 'API错误',
        type: 'line',
        data: apiData,
        smooth: false,
        itemStyle: { color: '#ff9800' },
        lineStyle: { color: '#ff9800' },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '行为异常',
        type: 'line',
        data: behaviorData,
        smooth: false,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '跨域错误',
        type: 'line',
        data: corsData,
        smooth: false,
        itemStyle: { color: '#722ed1' },
        lineStyle: { color: '#722ed1' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
}

const ErrorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null)
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false)
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // 根据标签页和搜索文本过滤数据
  const filteredErrors = useMemo(() => {
    let filtered = mockErrors

    // 根据标签页过滤
    if (activeTab !== 'all') {
      filtered = filtered.filter((error) => {
        if (activeTab === 'js') return error.type === 'js'
        if (activeTab === 'api') return error.type === 'api'
        if (activeTab === 'behavior') return error.type === 'behavior'
        return true
      })
    }

    // 根据搜索文本过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase()
      filtered = filtered.filter(
        (error) =>
          error.message.toLowerCase().includes(lowerSearchText) ||
          error.url.toLowerCase().includes(lowerSearchText) ||
          error.timestamp.includes(lowerSearchText) ||
          (error.userId && error.userId.toLowerCase().includes(lowerSearchText))
      )
    }

    return filtered
  }, [activeTab, searchText])

  // 当过滤条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchText])

  // 表格列定义
  const columns: ColumnsType<ErrorItem> = [
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: ErrorItem['type']) => {
        const typeConfig = {
          js: { color: 'red', text: 'JS错误', icon: <BugOutlined /> },
          api: { color: 'orange', text: 'API错误', icon: <ApiOutlined /> },
          behavior: { color: 'blue', text: '行为异常', icon: <UserOutlined /> },
          cors: { color: 'purple', text: '跨域错误', icon: <CloseCircleOutlined /> },
        }
        const config = typeConfig[type] || typeConfig.js
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: {
        showTitle: false,
      },
      render: (message: string) => (
        <Tooltip placement="topLeft" title={message}>
          <Text strong style={{ color: '#cf1332' }}>
            {message}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '页面URL',
      dataIndex: 'url',
      key: 'url',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (url: string) => (
        <Tooltip placement="topLeft" title={url}>
          <Text copyable={{ text: url }} style={{ color: '#1890ff' }}>
            {url}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '状态码/方法',
      key: 'statusCode',
      width: 120,
      render: (_, record) => {
        if (record.type === 'api') {
          return (
            <Space>
              {record.statusCode && (
                <Tag
                  color={
                    record.statusCode >= 500 ? 'red' : record.statusCode >= 400 ? 'orange' : 'green'
                  }
                >
                  {record.statusCode}
                </Tag>
              )}
              {record.method && <Tag>{record.method}</Tag>}
            </Space>
          )
        }
        return <Text type="secondary">-</Text>
      },
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (userId?: string) =>
        userId ? <Text code>{userId}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '发生时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'resolved' ? 'success' : 'warning'}>
          {status === 'resolved' ? '已处理' : '未处理'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedError(record)
                setDrawerVisible(true)
              }}
            >
              详情
            </Button>
          </Tooltip>
          {record.status === 'unresolved' && (
            <Tooltip title="标记为已处理">
              <Button type="link" icon={<CheckCircleOutlined />} size="small" danger>
                处理
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleClear = () => {
    setSearchText('')
  }

  // 生成 ECharts 折线图配置
  const chartOption = useMemo(
    () => generateEChartsOption(mockErrors, timeGranularity),
    [timeGranularity]
  )

  return (
    <div
      style={{
        padding: '16px',
        height: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', height: '100%' }}>
        {/* 第一个卡片 - 错误趋势折线图 */}
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>错误趋势</span>
            </Space>
          }
          extra={
            <Segmented
              value={timeGranularity}
              onChange={(value) => setTimeGranularity(value as TimeGranularity)}
              options={[
                { label: '按日', value: 'day' },
                { label: '按月', value: 'month' },
                { label: '按年', value: 'year' },
              ]}
              size="small"
            />
          }
          style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', minHeight: 0 }}
          styles={{
            body: {
              padding: '12px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            },
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <ReactECharts
              option={chartOption}
              style={{ width: '100%', height: '100%', minHeight: '280px' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </Card>

        {/* 第二个卡片 - 错误总览表格 */}
        <Card
          title="错误总览"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          styles={{
            body: {
              padding: '16px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            },
          }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              columns={columns}
              dataSource={filteredErrors}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条错误`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, size) => {
                  setCurrentPage(page)
                  setPageSize(size)
                },
                onShowSizeChange: (current, size) => {
                  setCurrentPage(1) // 切换页面大小时重置到第一页
                  setPageSize(size)
                },
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </div>
        </Card>
      </Space>

      {/* 错误详情抽屉 */}
      <Drawer
        title="错误详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          setSelectedError(null)
        }}
      >
        {selectedError && (
          <div>
            {/* 基础信息 */}
            <Descriptions title="基础信息" bordered column={1} size="small">
              <Descriptions.Item label="错误ID">
                <Text code>{selectedError.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="错误类型">
                <Tag
                  color={
                    selectedError.type === 'js'
                      ? 'red'
                      : selectedError.type === 'api'
                        ? 'orange'
                        : selectedError.type === 'behavior'
                          ? 'blue'
                          : 'purple'
                  }
                >
                  {selectedError.type === 'js'
                    ? 'JS错误'
                    : selectedError.type === 'api'
                      ? 'API错误'
                      : selectedError.type === 'behavior'
                        ? '行为异常'
                        : '跨域错误'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="错误信息">
                <Text strong style={{ color: '#cf1332' }}>
                  {selectedError.message}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="页面URL">
                <Text copyable={{ text: selectedError.url }} style={{ color: '#1890ff' }}>
                  {selectedError.url}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {selectedError.userId ? (
                  <Text code>{selectedError.userId}</Text>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">{selectedError.timestamp}</Descriptions.Item>
              <Descriptions.Item label="处理状态">
                <Tag color={selectedError.status === 'resolved' ? 'success' : 'warning'}>
                  {selectedError.status === 'resolved' ? '已处理' : '未处理'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                <Text style={{ fontSize: '12px' }}>{selectedError.userAgent}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* JS错误特有信息 */}
            {selectedError.type === 'js' && (
              <>
                <Descriptions
                  title="JS错误详情"
                  bordered
                  column={1}
                  size="small"
                  style={{ marginTop: 16 }}
                >
                  {selectedError.filename && (
                    <Descriptions.Item label="文件名">
                      <Text code>{selectedError.filename}</Text>
                    </Descriptions.Item>
                  )}
                  {selectedError.lineno !== undefined && (
                    <Descriptions.Item label="行号">{selectedError.lineno}</Descriptions.Item>
                  )}
                  {selectedError.colno !== undefined && (
                    <Descriptions.Item label="列号">{selectedError.colno}</Descriptions.Item>
                  )}
                  {selectedError.errorType && (
                    <Descriptions.Item label="错误类型">
                      <Tag>{selectedError.errorType}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {selectedError.stack && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>错误堆栈：</Text>
                    <Paragraph
                      copyable
                      style={{
                        marginTop: 8,
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {selectedError.stack}
                    </Paragraph>
                  </div>
                )}
              </>
            )}

            {/* API错误特有信息 */}
            {selectedError.type === 'api' && (
              <Descriptions
                title="API错误详情"
                bordered
                column={1}
                size="small"
                style={{ marginTop: 16 }}
              >
                {selectedError.method && (
                  <Descriptions.Item label="请求方法">
                    <Tag>{selectedError.method}</Tag>
                  </Descriptions.Item>
                )}
                {selectedError.statusCode !== undefined && (
                  <Descriptions.Item label="状态码">
                    <Tag
                      color={
                        selectedError.statusCode >= 500
                          ? 'red'
                          : selectedError.statusCode >= 400
                            ? 'orange'
                            : 'green'
                      }
                    >
                      {selectedError.statusCode}
                    </Tag>
                  </Descriptions.Item>
                )}
                {selectedError.statusText && (
                  <Descriptions.Item label="状态文本">{selectedError.statusText}</Descriptions.Item>
                )}
                {selectedError.duration !== undefined && (
                  <Descriptions.Item label="请求耗时">{selectedError.duration}ms</Descriptions.Item>
                )}
                {selectedError.timeout !== undefined && (
                  <Descriptions.Item label="超时时间">{selectedError.timeout}ms</Descriptions.Item>
                )}
                {selectedError.errorName && (
                  <Descriptions.Item label="错误名称">
                    <Text code>{selectedError.errorName}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* 请求和响应数据 */}
            {selectedError.type === 'api' &&
              (selectedError.requestData || selectedError.response) && (
                <div style={{ marginTop: 16 }}>
                  {selectedError.requestData && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>请求数据：</Text>
                      <Paragraph
                        copyable
                        style={{
                          marginTop: 8,
                          padding: '12px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof selectedError.requestData === 'string'
                          ? selectedError.requestData
                          : JSON.stringify(selectedError.requestData, null, 2)}
                      </Paragraph>
                    </div>
                  )}
                  {selectedError.response && (
                    <div>
                      <Text strong>响应数据：</Text>
                      <Paragraph
                        copyable
                        style={{
                          marginTop: 8,
                          padding: '12px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof selectedError.response === 'string'
                          ? selectedError.response
                          : JSON.stringify(selectedError.response, null, 2)}
                      </Paragraph>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ErrorPage
