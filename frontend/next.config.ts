/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.248.151.61:5000/api/:path*',
      },
    ]
  },
  env: {
    NEXT_PUBLIC_API_URL: 'http://192.248.151.61:5000',
  },
}

module.exports = nextConfig