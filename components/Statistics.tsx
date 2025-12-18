'use client';

import { useState, useEffect } from 'react';
import NationalityCharts from './NationalityCharts';

interface StatisticsProps {
  statistics: any;
}

// 国家代码到中文名称的映射
function getCountryName(countryCode: string): string {
  const countryMap: { [key: string]: string } = {
    'china': '中国',
    'thailand': '泰国',
    'cambodia': '柬埔寨',
    'vietnam': '越南',
    'laos': '老挝',
    'myanmar': '缅甸',
    'others': '其他' // 保留映射，但实际统计中已替换为实际国家名称
  };
  // 如果不在映射表中，直接返回原值（可能是自定义国家名称）
  return countryMap[countryCode] || countryCode;
}

export default function Statistics({ statistics }: StatisticsProps) {
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [editorData, setEditorData] = useState('');
  const [editorError, setEditorError] = useState('');

  // 从localStorage加载保存的数据
  useEffect(() => {
    const savedData = localStorage.getItem('nationality_chart_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setChartData(parsed);
      } catch (error) {
        console.error('Failed to parse saved chart data:', error);
      }
    }
  }, []);

  // 默认数据
  const defaultData = {
    teamGroup: {
      '中国': 116,
      '泰国': 22,
      '老挝': 27,
      '越南': 14,
      '缅甸': 17,
      '柬埔寨': 5
    },
    enterpriseGroup: {
      '中国': 56,
      '泰国': 6,
      '老挝': 4,
      '越南': 1,
      '缅甸': 11,
      '柬埔寨': 1
    }
  };

  const handleOpenEditor = () => {
    const currentData = chartData || defaultData;
    setEditorData(JSON.stringify(currentData, null, 2));
    setShowDataEditor(true);
    setEditorError('');
  };

  const handleSaveData = () => {
    try {
      const parsed = JSON.parse(editorData);
      // 验证数据格式
      if (!parsed.teamGroup || !parsed.enterpriseGroup) {
        throw new Error('数据格式错误：必须包含 teamGroup 和 enterpriseGroup 字段');
      }
      if (typeof parsed.teamGroup !== 'object' || typeof parsed.enterpriseGroup !== 'object') {
        throw new Error('数据格式错误：teamGroup 和 enterpriseGroup 必须是对象');
      }
      
      // 保存到localStorage
      localStorage.setItem('nationality_chart_data', JSON.stringify(parsed));
      setChartData(parsed);
      setShowDataEditor(false);
      setEditorError('');
    } catch (error: any) {
      setEditorError(error.message || '数据格式错误，请检查JSON格式');
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('nationality_chart_data');
    setChartData(null);
    setEditorData(JSON.stringify(defaultData, null, 2));
    setEditorError('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setEditorData(JSON.stringify(parsed, null, 2));
        setEditorError('');
      } catch (error: any) {
        setEditorError('文件解析失败：' + error.message);
      }
    };
    reader.readAsText(file);
  };

  if (!statistics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无统计数据</p>
      </div>
    );
  }

  // 安全地解构统计数据，提供默认值
  const assignments = statistics.assignments || {};
  const files = statistics.files || {};
  const teams = statistics.teams || {};
  const nationality = statistics.nationality || {};

  return (
    <div className="space-y-6">
      <div className="relative">
        <h2 
          className="text-lg font-medium text-gray-900 mb-4 cursor-pointer hover:text-blue-600 transition-colors"
          onDoubleClick={handleOpenEditor}
          title="双击打开数据校核"
        >
          统计报告
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          系统整体运行情况和评审进度统计
        </p>
        {/* 隐蔽的校核按钮 */}
        <button
          onClick={handleOpenEditor}
          className="absolute top-0 right-0 text-xs text-gray-400 hover:text-gray-600 opacity-30 hover:opacity-100 transition-opacity"
          title="统计数据校核"
        >
          ⚙️ 校核
        </button>
      </div>

      {/* Team Statistics - 从mock数据计算 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">团队统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                const currentData = chartData || defaultData;
                const teamGroupValues = Object.values(currentData.teamGroup) as number[];
                const enterpriseGroupValues = Object.values(currentData.enterpriseGroup) as number[];
                const teamGroupTotal = teamGroupValues.reduce((a, b) => a + b, 0);
                const enterpriseGroupTotal = enterpriseGroupValues.reduce((a, b) => a + b, 0);
                return teamGroupTotal + enterpriseGroupTotal;
              })()}
            </div>
            <div className="text-sm text-blue-800">团队总计（已通过审核）</div>
          </div>
        </div>
      </div>

      {/* Nationality Charts - 图表展示 */}
      <div className="bg-gradient-to-br from-gray-50 to-white shadow-xl rounded-xl p-8 border border-gray-200">
        <NationalityCharts data={chartData || defaultData} />
      </div>

      {/* Nationality Statistics - 暂时隐藏 */}
      {nationality && Object.keys(nationality).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">国别统计详情</h3>
          
          {/* 总览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {nationality.enterprise?.total || 0}
              </div>
              <div className="text-sm text-orange-800">企业组</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {nationality.team_groups?.single_nationality?.count || 0}
              </div>
              <div className="text-sm text-blue-800">单一国别团队</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {nationality.team_groups?.multiple_nationality?.count || 0}
              </div>
              <div className="text-sm text-purple-800">多国别团队</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {nationality.summary?.total_countries_involved || 0}
              </div>
              <div className="text-sm text-green-800">涉及国家总数</div>
            </div>
          </div>

          {/* 企业组国别统计 */}
          {nationality.enterprise?.by_country && Object.keys(nationality.enterprise.by_country).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">企业组注册国家分布</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(nationality.enterprise.by_country).map(([country, count]) => (
                  <div key={country} className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{count as number}</div>
                    <div className="text-xs text-orange-800">{getCountryName(country)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 国家参与度统计 */}
          {nationality.summary?.country_participation && Object.keys(nationality.summary.country_participation).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">国家参与度统计</h4>
              <div className="space-y-2">
                {Object.entries(nationality.summary.country_participation).map(([country, data]: [string, any]) => {
                  const total = (data.single || 0) + (data.multiple || 0) + (data.enterprise || 0);
                  return (
                    <div key={country} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-800">{getCountryName(country)}</div>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-blue-600">单一: {data.single || 0}</span>
                          <span className="text-purple-600">多国: {data.multiple || 0}</span>
                          <span className="text-orange-600">企业: {data.enterprise || 0}</span>
                          <span className="text-green-600 font-bold">总计: {total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 团队组多国别组合统计 */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">团队组多国别组合</h4>
            {nationality.team_groups?.multiple_nationality?.combinations && Object.keys(nationality.team_groups.multiple_nationality.combinations).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(nationality.team_groups.multiple_nationality.combinations).map(([combination, count]) => (
                  <div key={combination} className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-purple-800">
                        {combination === '未指定' ? '未指定国家' : combination.split(' + ').map(country => getCountryName(country)).join(' + ')}
                      </div>
                      <div className="text-lg font-bold text-purple-600">{count as number} 个团队</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                暂无多国别团队数据
              </div>
            )}
          </div>
        </div>
      )}


      {/* Assignment Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">评审任务统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{assignments.total_assignments || 0}</div>
            <div className="text-sm text-gray-800">总分配任务</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{assignments.pending_reviews || 0}</div>
            <div className="text-sm text-yellow-800">待评审</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{assignments.in_progress_reviews || 0}</div>
            <div className="text-sm text-blue-800">评审中</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{assignments.completed_reviews || 0}</div>
            <div className="text-sm text-green-800">已完成</div>
          </div>
        </div>
      </div>

      {/* Score Statistics */}
      {assignments.completed_reviews > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">评分统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {assignments.average_score ? assignments.average_score.toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-purple-800">平均分</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {assignments.completed_reviews}
              </div>
              <div className="text-sm text-indigo-800">已评分数量</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">完成进度</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>评审完成率</span>
              <span>
                {assignments.total_assignments > 0 
                  ? ((assignments.completed_reviews / assignments.total_assignments) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${assignments.total_assignments > 0 
                    ? (assignments.completed_reviews / assignments.total_assignments) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-blue-900 mb-2">系统概览</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 共分配 {assignments.total_assignments} 个评审任务</li>
          <li>• 已完成 {assignments.completed_reviews} 个评审</li>
          {assignments.average_score && (
            <li>• 当前平均评分: {assignments.average_score.toFixed(2)} 分</li>
          )}
        </ul>
      </div>

      {/* 数据校核模态框 */}
      {showDataEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">统计数据校核</h3>
              <button
                onClick={() => setShowDataEditor(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数据格式说明
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-4">
                  <pre className="whitespace-pre-wrap">{`{
  "teamGroup": {
    "中国": 116,
    "泰国": 22,
    "老挝": 27,
    "越南": 14,
    "缅甸": 17,
    "柬埔寨": 5
  },
  "enterpriseGroup": {
    "中国": 56,
    "泰国": 6,
    "老挝": 4,
    "越南": 1,
    "缅甸": 11,
    "柬埔寨": 1
  }
}`}</pre>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    输入JSON数据
                  </label>
                  <div className="flex gap-2">
                    <label className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded cursor-pointer hover:bg-blue-200">
                      上传文件
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleResetData}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      重置为默认
                    </button>
                  </div>
                </div>
                <textarea
                  value={editorData}
                  onChange={(e) => {
                    setEditorData(e.target.value);
                    setEditorError('');
                  }}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入JSON格式的数据..."
                />
                {editorError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {editorError}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowDataEditor(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveData}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                保存并应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
