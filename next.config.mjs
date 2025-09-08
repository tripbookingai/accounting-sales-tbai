/** @type {import('next').NextConfig} */

import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins || []
      config.plugins.push(new MiniCssExtractPlugin())
    }
    return config
  },
}

export default nextConfig
