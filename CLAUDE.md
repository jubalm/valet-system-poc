# CLAUDE.md

This file provides team-shared guidance for Claude Code when working with this repository.

## Project Overview

This is a Cloudflare Workers + Containers application demonstrating HTTP passthrough architecture. It combines a React frontend with a Cloudflare Worker backend that proxies requests to a containerized Convex backend running on the edge.

**Reference**: See `@docs/README.md` for complete documentation index and `@docs/project-requirements-plan.md` for comprehensive project specifications.

## Architecture

### Current Stack
- **Frontend**: React 19 with TypeScript, built with Vite
- **UI Components**: shadcn/ui with Tailwind CSS (planned)
- **Backend**: Cloudflare Worker with Durable Objects managing container lifecycle
- **Container**: Custom Convex backend running in Cloudflare Containers
- **Authentication**: Convex Auth with built-in user management
- **Deployment**: Integrated Cloudflare Workers + Containers platform

### HTTP Passthrough Pattern
```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

### Integration Patterns
- **API Gateway Pattern**: Workers handle routing, authentication, caching before container access
- **Service Mesh Pattern**: Private connections between containers with programmable routing
- **Orchestrator Pattern**: Custom scheduling, scaling, and health checking via Durable Objects
- **Hybrid Architecture**: Edge layer (Workers) + substantial compute (Containers)

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

#### Development
- `npm run dev` - Start development server with hot reload
- `npm run dev:backend` - Start Convex backend development
- `npm run predev` - Setup Convex dev environment with dashboard

#### Build & Deploy
- `npm run build` - Build both frontend and worker (`tsc -b && vite build`)
- `npm run preview` - Build and preview the production build locally
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare bindings

#### Quality Assurance
- `npm run lint` - Run ESLint on all files (ALWAYS run before commits)
- `wrangler tail` - Monitor deployment logs and errors

#### Future Commands (when shadcn/ui is integrated)
- `npx shadcn@latest add [component]` - Add shadcn/ui components
- `npx tailwindcss init` - Initialize Tailwind configuration

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

## Implementation Roadmap

### Phase 1: Foundation (Current → Week 1)
- [ ] Complete shadcn/ui and Tailwind CSS integration
- [ ] Enhance TypeScript path mapping configuration
- [ ] Set up component library structure
- [ ] Validate hot reload with new dependencies

### Phase 2: Container Enhancement (Week 2)
- [ ] Robust container lifecycle management
- [ ] Comprehensive error handling and fallbacks
- [ ] Monitoring and health checks
- [ ] Container startup optimization

### Phase 3: Feature Development (Week 3-4)
- [ ] Core UI components with shadcn/ui
- [ ] Authentication flow with Convex Auth
- [ ] Real-time data synchronization
- [ ] API endpoints and business logic

### Phase 4: Production Ready (Week 5-6)
- [ ] Performance optimization and caching
- [ ] Security hardening
- [ ] Production deployment setup
- [ ] Comprehensive documentation

## Quick Reference

### Documentation
- `@docs/README.md` - Complete documentation index
- `@docs/project-requirements-plan.md` - Comprehensive project specifications
- `@docs/technical-architecture.md` - System architecture details
- `@docs/development-workflows.md` - Development processes and workflows
- `@docs/cloudflare-containers-setup.md` - Deployment guide

### Container Management
- Containers managed via Durable Objects in `worker/index.ts:3`
- Container lifecycle: start → proxy requests → auto-sleep after timeout
- Health checks via HTTP endpoints on ports 3210/3211
- Container configuration in `Dockerfile` and `wrangler.jsonc:16`

### Convex Integration
- Schema defined in `convex/schema.ts:8`
- Authentication tables from `@convex-dev/auth/server:3`
- Function definitions in `convex/` directory
- Real-time sync via WebSocket connections

### Development Workflow
1. `npm run dev` - Frontend development with hot reload
2. `npm run dev:backend` - Convex backend development
3. `npm run lint` - Code quality check (MANDATORY before commits)
4. `npm run build` - Production build verification
5. `npm run deploy` - Deploy to Cloudflare edge