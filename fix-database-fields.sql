-- 修复数据库字段问题
-- 如果存在 document_size 字段，重命名为 file_size

-- 检查并修复 team_documents 表
ALTER TABLE team_documents 
CHANGE COLUMN document_size file_size INT NOT NULL;

-- 如果上面的命令失败（字段不存在），则添加 file_size 字段
-- ALTER TABLE team_documents ADD COLUMN file_size INT NOT NULL AFTER document_path;

-- 检查表结构
DESCRIBE team_documents;
