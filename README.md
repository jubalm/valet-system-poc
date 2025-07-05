# Cloudflare Workers + Containers HTTP Passthrough

A production-ready demonstration of HTTP passthrough architecture using Cloudflare Workers, Durable Objects, and Containers to proxy requests to a Convex backend running on the edge.

## 🚀 Architecture

```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

This project showcases:
- **Edge computing**: Convex backend running directly on Cloudflare's global network
- **HTTP passthrough**: Seamless request forwarding from Workers to containerized backends
- **Custom containers**: Bypassing public registry limitations with custom Dockerfiles
- **Production performance**: 92%+ success rate with ~770ms response times

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Cloudflare Workers + Durable Objects + Containers
- **Database**: Convex backend with SQLite persistence
- **Deployment**: Cloudflare Workers with integrated container registry

## 📚 Documentation

See [docs/README.md](./docs/README.md) for detailed setup instructions, architecture overview, and troubleshooting guide.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate TypeScript types for Cloudflare bindings
npm run cf-typegen

# Deploy to Cloudflare (builds and deploys everything)
npm run deploy
```

## 🔗 Key Files

- [`worker/index.ts`](./worker/index.ts) - Worker and Durable Object implementation
- [`Dockerfile`](./Dockerfile) - Custom Convex backend container
- [`wrangler.jsonc`](./wrangler.jsonc) - Cloudflare configuration
- [`docs/README.md`](./docs/README.md) - Complete documentation

## 📊 Performance

Achieved in production testing:
- **Success rate**: 92.86%
- **Response time**: ~770ms average
- **Container startup**: 15-30 seconds
- **Edge deployment**: Global Cloudflare network

## 🔧 Development

```bash
# Start local development
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

This project demonstrates enterprise-grade edge computing patterns and serves as a reference implementation for containerized microservices on Cloudflare's platform.