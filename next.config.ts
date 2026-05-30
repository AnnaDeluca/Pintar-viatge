import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Pintar-viatge',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
