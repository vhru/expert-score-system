'use client';

interface StatisticsProps {
  statistics: any;
}

export default function Statistics({ statistics }: StatisticsProps) {
  if (!statistics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无统计数据</p>
      </div>
    );
  }

  const { assignments, files } = statistics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">统计报告</h2>
        <p className="text-sm text-gray-600 mb-6">
          系统整体运行情况和评审进度统计
        </p>
      </div>

      {/* File Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">文件统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{files.total_files}</div>
            <div className="text-sm text-blue-800">总文件数</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{files.completed_files}</div>
            <div className="text-sm text-green-800">已完成上传</div>
          </div>
        </div>
      </div>

      {/* Assignment Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">评审任务统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{assignments.total_assignments}</div>
            <div className="text-sm text-gray-800">总分配任务</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{assignments.pending_reviews}</div>
            <div className="text-sm text-yellow-800">待评审</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{assignments.in_progress_reviews}</div>
            <div className="text-sm text-blue-800">评审中</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{assignments.completed_reviews}</div>
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
          
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>文件处理率</span>
              <span>
                {files.total_files > 0 
                  ? ((files.completed_files / files.total_files) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${files.total_files > 0 
                    ? (files.completed_files / files.total_files) * 100 
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
          <li>• 系统已处理 {files.total_files} 个文件</li>
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
