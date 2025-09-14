#!/bin/bash

echo "=== Docker容器内文件上传测试 ==="

# 进入运行中的容器
CONTAINER_NAME="expert_review_app"

echo "1. 检查容器是否运行..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ 容器 $CONTAINER_NAME 未运行"
    exit 1
fi

echo "✅ 容器正在运行"

echo "2. 检查环境变量..."
docker exec $CONTAINER_NAME printenv | grep UPLOAD_DIR

echo "3. 检查上传目录..."
docker exec $CONTAINER_NAME ls -la /opt/team_data

echo "4. 测试目录权限..."
docker exec $CONTAINER_NAME touch /opt/team_data/test_permission.txt
if [ $? -eq 0 ]; then
    echo "✅ 目录可写"
    docker exec $CONTAINER_NAME rm /opt/team_data/test_permission.txt
else
    echo "❌ 目录不可写"
fi

echo "5. 创建子目录..."
docker exec $CONTAINER_NAME mkdir -p /opt/team_data/member-cvs
docker exec $CONTAINER_NAME mkdir -p /opt/team_data/team-documents
docker exec $CONTAINER_NAME mkdir -p /opt/team_data/team-images
docker exec $CONTAINER_NAME mkdir -p /opt/team_data/photos

echo "6. 检查子目录..."
docker exec $CONTAINER_NAME ls -la /opt/team_data/

echo "7. 测试文件写入..."
docker exec $CONTAINER_NAME sh -c 'echo "test content" > /opt/team_data/test.txt'
if [ $? -eq 0 ]; then
    echo "✅ 文件写入成功"
    docker exec $CONTAINER_NAME rm /opt/team_data/test.txt
else
    echo "❌ 文件写入失败"
fi

echo "8. 检查Node.js进程..."
docker exec $CONTAINER_NAME ps aux | grep node

echo "9. 检查应用日志..."
echo "最近的错误日志:"
docker logs $CONTAINER_NAME --tail 20

echo "=== 测试完成 ==="
