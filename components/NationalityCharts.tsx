'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NationalityChartsProps {
  data: {
    teamGroup: { [key: string]: number };
    enterpriseGroup: { [key: string]: number };
  };
}

// Mock数据 - 根据用户提供的表格数据
const MOCK_DATA = {
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

// 颜色方案 - 专业且美观
const COLORS = {
  teamGroup: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  enterpriseGroup: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'],
  combined: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777']
};

export default function NationalityCharts({ data = MOCK_DATA }: NationalityChartsProps) {
  // 准备饼图数据
  const teamGroupPieData = Object.entries(data.teamGroup).map(([name, value]) => ({
    name,
    value
  }));

  const enterpriseGroupPieData = Object.entries(data.enterpriseGroup).map(([name, value]) => ({
    name,
    value
  }));

  // 准备对比柱状图数据
  const countries = Array.from(new Set([
    ...Object.keys(data.teamGroup),
    ...Object.keys(data.enterpriseGroup)
  ]));

  const comparisonData = countries.map(country => ({
    country,
    '团队组': data.teamGroup[country] || 0,
    '企业组': data.enterpriseGroup[country] || 0,
    '总计': (data.teamGroup[country] || 0) + (data.enterpriseGroup[country] || 0)
  }));

  // 准备总计柱状图数据
  const totalData = countries.map(country => ({
    country,
    value: (data.teamGroup[country] || 0) + (data.enterpriseGroup[country] || 0)
  })).sort((a, b) => b.value - a.value);

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name || payload[0].payload.country}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 计算总数用于百分比计算
  const teamGroupTotal = Object.values(data.teamGroup).reduce((a, b) => a + b, 0);
  const enterpriseGroupTotal = Object.values(data.enterpriseGroup).reduce((a, b) => a + b, 0);

  // 自定义Label - 修复百分比计算
  const renderTeamGroupLabel = (entry: any) => {
    if (teamGroupTotal === 0) return `${entry.name}: ${entry.value}`;
    const percent = ((entry.value / teamGroupTotal) * 100).toFixed(1);
    return `${entry.name}: ${entry.value} (${percent}%)`;
  };

  const renderEnterpriseGroupLabel = (entry: any) => {
    if (enterpriseGroupTotal === 0) return `${entry.name}: ${entry.value}`;
    const percent = ((entry.value / enterpriseGroupTotal) * 100).toFixed(1);
    return `${entry.name}: ${entry.value} (${percent}%)`;
  };

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">国别分布统计图表</h2>
        <p className="text-gray-600">团队组与企业组国别分布可视化分析</p>
      </div>

      {/* 饼图区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 团队组饼图 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            团队组国别分布
          </h3>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-2xl font-bold text-blue-600">
                {teamGroupTotal}
              </span>
              <span className="text-sm text-blue-800 ml-2">个团队</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={teamGroupPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderTeamGroupLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {teamGroupPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.teamGroup[index % COLORS.teamGroup.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 企业组饼图 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            企业组国别分布
          </h3>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-50 px-4 py-2 rounded-lg">
              <span className="text-2xl font-bold text-orange-600">
                {enterpriseGroupTotal}
              </span>
              <span className="text-sm text-orange-800 ml-2">个企业</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={enterpriseGroupPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderEnterpriseGroupLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {enterpriseGroupPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.enterpriseGroup[index % COLORS.enterpriseGroup.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 对比柱状图 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
          团队组 vs 企业组国别对比
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="country" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar dataKey="团队组" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="企业组" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 总计柱状图 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
          各国总计分布（团队组 + 企业组）
        </h3>
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-3 rounded-lg border border-gray-200">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              {totalData.reduce((sum, item) => sum + item.value, 0)}
            </span>
            <span className="text-sm text-gray-700 ml-2">总计</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={totalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="country" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="url(#colorGradient)" 
              radius={[8, 8, 0, 0]}
            >
              {totalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.combined[index % COLORS.combined.length]} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 数据汇总表格 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          数据汇总表
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                国家
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                团队组
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                企业组
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总计
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                占比
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonData
              .map(item => ({
                ...item,
                total: item.总计
              }))
              .sort((a, b) => b.total - a.total)
              .map((item, index) => {
                const grandTotal = comparisonData.reduce((sum, i) => sum + i.总计, 0);
                const percentage = ((item.总计 / grandTotal) * 100).toFixed(1);
                return (
                  <tr key={item.country} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: COLORS.combined[index % COLORS.combined.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{item.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {item.团队组}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                      {item.企业组}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {item.总计}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-orange-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            <tr className="bg-gray-100 font-bold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">合计</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {comparisonData.reduce((sum, item) => sum + item.团队组, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                {comparisonData.reduce((sum, item) => sum + item.企业组, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {comparisonData.reduce((sum, item) => sum + item.总计, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

