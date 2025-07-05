# CLAUDE.md

This file provides team-shared guidance for Claude Code when working with this repository.

## Project Overview

This is a Cloudflare Workers + Containers application demonstrating HTTP passthrough architecture. It combines a React frontend with a Cloudflare Worker backend that proxies requests to a containerized Convex backend running on the edge.

## Architecture

- **Frontend**: React 19 with TypeScript, built with Vite
- **Backend**: Cloudflare Worker with Durable Objects managing container lifecycle
- **Container**: Custom Convex backend running in Cloudflare Containers
- **Deployment**: Integrated Cloudflare Workers + Containers platform

The application follows this pattern:
```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

## Team Development Standards

### Code Quality
- Always run `npm run lint` before commits
- Use TypeScript strictly - no `any` types
- Follow existing patterns for error handling and logging
- Prefer editing existing files over creating new ones

### Testing Standards
- Test locally before deployment: `npm run dev`
- Verify production builds: `npm run build`
- Use container testing for backend changes
- Monitor deployment success with `wrangler tail`

### Key Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build both frontend and worker (`tsc -b && vite build`)
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Build and preview the production build locally
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare bindings

### File Organization
- `src/` - React frontend application
- `worker/` - Cloudflare Worker and Durable Object code
- `docs/` - Technical documentation with descriptive filenames
- `.claude/` - Claude-specific project memory and settings

## Configuration Management

- `wrangler.jsonc` - Cloudflare deployment configuration
- `vite.config.ts` - Frontend build configuration
- Multiple TypeScript configs for different environments
- Environment variables managed through Dockerfile and wrangler config

## API Patterns

- All `/api/*` routes handled by Worker
- HTTP passthrough to containerized backend
- Proper error handling with fallback responses
- JSON responses using Cloudflare's `Response.json()` helper