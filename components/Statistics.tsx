'use client';

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
    'myanmar': '缅甸'
  };
  return countryMap[countryCode] || countryCode;
}

export default function Statistics({ statistics }: StatisticsProps) {
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
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">统计报告</h2>
        <p className="text-sm text-gray-600 mb-6">
          系统整体运行情况和评审进度统计
        </p>
      </div>

      {/* Team Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">团队统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teams.total_teams || 0}</div>
            <div className="text-sm text-blue-800">总团队数</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{teams.enterprise_teams || 0}</div>
            <div className="text-sm text-green-800">企业组</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{teams.team_groups || 0}</div>
            <div className="text-sm text-purple-800">团队组</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{teams.active_teams || 0}</div>
            <div className="text-sm text-yellow-800">活跃团队</div>
          </div>
        </div>
      </div>

      {/* Nationality Statistics */}
      {nationality && Object.keys(nationality).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">国别统计</h3>
          
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

          {/* 团队组单一国别统计 */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">团队组单一国别分布</h4>
            {nationality.team_groups?.single_nationality?.by_country && Object.keys(nationality.team_groups.single_nationality.by_country).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(nationality.team_groups.single_nationality.by_country).map(([country, count]) => (
                  <div key={country} className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{count as number}</div>
                    <div className="text-xs text-blue-800">{country === '未指定' ? '未指定国家' : getCountryName(country)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                暂无单一国别团队数据
              </div>
            )}
          </div>

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

          {/* 国家参与度统计 */}
          {nationality.summary?.country_participation && Object.keys(nationality.summary.country_participation).length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">国家参与度统计</h4>
              <div className="space-y-2">
                {Object.entries(nationality.summary.country_participation).map(([country, data]: [string, any]) => (
                  <div key={country} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-800">{getCountryName(country)}</div>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-blue-600">单一: {data.single}</span>
                        <span className="text-purple-600">多国: {data.multiple}</span>
                        <span className="text-green-600 font-bold">总计: {data.single + data.multiple}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    </div>
  );
}
