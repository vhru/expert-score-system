'use client';

import { useState } from 'react';

interface Assignment {
  id: number;
  file_id: number;
  expert_id: number;
  assignment_status: string;
  score?: number;
  comments?: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

interface MyAssignmentsProps {
  assignments: Assignment[];
  token: string;
  onUpdate: () => void;
}

export default function MyAssignments({ assignments, token, onUpdate }: MyAssignmentsProps) {
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSubmitReview = async (assignmentId: number, score: number, comments: string) => {
    setSubmittingId(assignmentId);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId,
          score,
          comments
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('评审提交成功！');
        setMessageType('success');
        onUpdate();
      } else {
        setMessage(data.error || '提交失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '待评审';
      case 'in_progress': return '评审中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onSubmitReview={handleSubmitReview}
            submitting={submittingId === assignment.id}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </div>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  onSubmitReview: (id: number, score: number, comments: string) => void;
  submitting: boolean;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}

function AssignmentCard({ assignment, onSubmitReview, submitting, getStatusText, getStatusColor }: AssignmentCardProps) {
  const [score, setScore] = useState(assignment.score || '');
  const [comments, setComments] = useState(assignment.comments || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseFloat(score.toString());
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert('请输入0-100之间的有效分数');
      return;
    }
    onSubmitReview(assignment.id, scoreNum, comments);
  };

  const canEdit = assignment.assignment_status !== 'completed';

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {assignment.team_name || assignment.original_name}
          </h3>
          <p className="text-sm text-gray-500">
            文件类型: {assignment.mime_type}
          </p>
          <p className="text-sm text-gray-500">
            分配时间: {new Date(assignment.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.assignment_status)}`}>
          {getStatusText(assignment.assignment_status)}
        </span>
      </div>

      {assignment.assignment_status === 'completed' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>已提交评分:</strong> {assignment.score} 分
          </p>
          {assignment.comments && (
            <p className="text-sm text-green-800 mt-1">
              <strong>评审意见:</strong> {assignment.comments}
            </p>
          )}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`score-${assignment.id}`} className="form-label">
              评分 (0-100分) *
            </label>
            <input
              id={`score-${assignment.id}`}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="form-input"
              placeholder="请输入0-100之间的分数"
              required
            />
          </div>

          <div>
            <label htmlFor={`comments-${assignment.id}`} className="form-label">
              评审意见
            </label>
            <textarea
              id={`comments-${assignment.id}`}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="请输入评审意见和建议..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交评审'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
