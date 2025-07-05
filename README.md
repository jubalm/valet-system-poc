# Cloudflare Workers + Containers HTTP Passthrough

A production demonstration of HTTP passthrough architecture using Cloudflare Workers and Containers to proxy requests to a Convex backend running on the edge.

## What This Does

This project showcases modern edge computing by running a Convex backend directly on Cloudflare's global network through their container platform. Requests flow seamlessly from your browser through Cloudflare Workers to a containerized backend.

## Architecture

```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

## Quick Start

```bash
# Install dependencies
npm install

# Generate Cloudflare bindings
npm run cf-typegen

# Deploy to Cloudflare
npm run deploy
```

## Performance

- **Success rate**: 92%+ in production testing
- **Response time**: ~770ms average
- **Global deployment**: Cloudflare's edge network

## Development

```bash
# Local development
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Documentation

- [Container Setup Guide](./docs/cloudflare-containers-setup.md) - Detailed deployment instructions
- [Architecture Deep Dive](./docs/http-passthrough-architecture.md) - Technical implementation details
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

This project serves as a reference implementation for containerized microservices on Cloudflare's platform.