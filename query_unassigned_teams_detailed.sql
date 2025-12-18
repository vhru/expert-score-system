-- 详细诊断：找出未分配团队的原因

-- 1. 查看未分配团队是否有文件记录
SELECT 
    t.id AS team_id,
    t.team_name,
    COUNT(DISTINCT f.id) AS file_count,
    COUNT(DISTINCT td.id) AS team_document_count,
    COUNT(ra.id) AS assignment_count,
    CASE 
        WHEN COUNT(DISTINCT td.id) = 0 THEN '没有上传任何文档'
        WHEN COUNT(DISTINCT f.id) = 0 THEN '无法找到或创建对应的文件记录'
        WHEN COUNT(ra.id) = 0 THEN '有文件但没有分配记录'
        WHEN COUNT(ra.id) = 1 THEN CONCAT('只有 ', COUNT(ra.id), ' 个专家分配记录')
        ELSE '已分配'
    END AS reason
FROM teams t
LEFT JOIN team_documents td ON td.team_id = t.id
LEFT JOIN files f ON f.file_path = td.document_path OR f.team_name = t.team_name
LEFT JOIN review_assignments ra ON ra.file_id = f.id
WHERE t.status = 'active' 
  AND t.audit_status = 'approved'
GROUP BY t.id, t.team_name
HAVING COUNT(ra.id) < 2
ORDER BY file_count ASC, assignment_count ASC, t.team_name;

-- 2. 查看这些团队的文件情况
SELECT 
    t.id AS team_id,
    t.team_name,
    td.document_name,
    td.document_path,
    f.id AS file_id,
    f.team_name AS file_team_name,
    CASE 
        WHEN f.id IS NULL THEN 'files表中没有对应记录'
        ELSE 'files表中有记录'
    END AS file_status
FROM teams t
LEFT JOIN team_documents td ON td.team_id = t.id
LEFT JOIN files f ON f.file_path = td.document_path OR f.team_name = t.team_name
WHERE t.status = 'active' 
  AND t.audit_status = 'approved'
  AND t.id IN (
    -- 找出未分配的团队ID
    SELECT t2.id
    FROM teams t2
    LEFT JOIN files f2 ON f2.team_name = t2.team_name
    LEFT JOIN review_assignments ra2 ON ra2.file_id = f2.id
    WHERE t2.status = 'active' 
      AND t2.audit_status = 'approved'
    GROUP BY t2.id, t2.team_name
    HAVING COUNT(ra2.id) < 2
  )
ORDER BY t.team_name, td.document_name;

-- 3. 统计未分配团队的原因分布
SELECT 
    CASE 
        WHEN COUNT(DISTINCT td.id) = 0 THEN '没有上传任何文档'
        WHEN COUNT(DISTINCT f.id) = 0 THEN '无法找到或创建对应的文件记录'
        WHEN COUNT(ra.id) = 0 THEN '有文件但没有分配记录'
        WHEN COUNT(ra.id) = 1 THEN '只有1个专家分配记录'
        ELSE '其他'
    END AS reason_category,
    COUNT(*) AS team_count
FROM teams t
LEFT JOIN team_documents td ON td.team_id = t.id
LEFT JOIN files f ON f.file_path = td.document_path OR f.team_name = t.team_name
LEFT JOIN review_assignments ra ON ra.file_id = f.id
WHERE t.status = 'active' 
  AND t.audit_status = 'approved'
GROUP BY t.id, t.team_name
HAVING COUNT(ra.id) < 2
GROUP BY reason_category
ORDER BY team_count DESC;


