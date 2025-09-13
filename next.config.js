/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // 移除experimental.appDir，Next.js 14默认启用
  // 移除env配置，使用环境变量文件
}

module.exports = nextConfig
