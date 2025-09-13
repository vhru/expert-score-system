@echo off
chcp 65001 >nul
echo ========================================
echo 专家盲审系统 - 自动打包脚本
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "package.json" (
    echo 错误: 请在项目根目录执行此脚本
    echo 当前目录: %CD%
    pause
    exit /b 1
)

echo 正在检查项目结构...
if not exist "app" (
    echo 错误: 未找到 app 目录
    pause
    exit /b 1
)

echo 项目结构检查通过 ✓
echo.

REM 删除旧的压缩包
if exist "specialist_score_system.zip" (
    echo 删除旧的压缩包...
    del "specialist_score_system.zip"
)

echo 开始打包项目文件...
echo.

REM 创建临时目录
if exist "temp_package" (
    rmdir /S /Q "temp_package"
)
mkdir "temp_package"

echo 复制源代码目录...
xcopy /E /I /Q "app" "temp_package\app"
xcopy /E /I /Q "components" "temp_package\components"
xcopy /E /I /Q "lib" "temp_package\lib"
xcopy /E /I /Q "scripts" "temp_package\scripts"

echo 复制配置文件...
copy /Y "package.json" "temp_package\"
copy /Y "package-lock.json" "temp_package\"
copy /Y "Dockerfile" "temp_package\"
copy /Y "docker-compose.yml" "temp_package\"
copy /Y "init.sql" "temp_package\"
copy /Y "env.example" "temp_package\"
copy /Y "tailwind.config.js" "temp_package\"
copy /Y "next.config.js" "temp_package\"
copy /Y "tsconfig.json" "temp_package\"
copy /Y "postcss.config.js" "temp_package\"

echo 复制文档文件...
copy /Y "*.md" "temp_package\"

echo 创建上传目录结构...
mkdir "temp_package\uploads"
mkdir "temp_package\uploads\team-documents"
mkdir "temp_package\uploads\team-images"

echo 使用PowerShell压缩文件...
powershell -Command "& {Compress-Archive -Path 'temp_package\*' -DestinationPath 'specialist_score_system.zip' -Force -CompressionLevel Optimal}"

if %ERRORLEVEL% neq 0 (
    echo 错误: 压缩失败
    pause
    exit /b 1
)

echo 清理临时文件...
rmdir /S /Q "temp_package"

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo 文件名: specialist_score_system.zip
echo 位置: %CD%\specialist_score_system.zip

REM 显示文件大小
for %%A in ("specialist_score_system.zip") do echo 文件大小: %%~zA 字节

echo.
echo 包含的文件:
echo ✓ 源代码 (app, components, lib, scripts)
echo ✓ 配置文件 (package.json, Dockerfile, etc.)
echo ✓ 数据库脚本 (init.sql)
echo ✓ 环境配置模板 (env.example)
echo ✓ 文档文件 (*.md)
echo ✓ 上传目录结构
echo.
echo 排除的文件:
echo ✗ node_modules (依赖包)
echo ✗ .git (版本控制)
echo ✗ uploads/* (用户上传文件)
echo ✗ *.log (日志文件)
echo.
echo 现在可以上传到阿里云ECS了！
echo ========================================
pause
