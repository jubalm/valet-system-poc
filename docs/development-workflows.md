# Development Workflows Documentation

## Overview

This document outlines the comprehensive development workflows for the Valet System PoC, covering everything from initial setup to production deployment. These workflows are designed to maximize developer productivity while maintaining code quality and system reliability.

## Environment Setup

### Prerequisites
- **Node.js**: Version 18+ with npm
- **Docker**: For local container testing
- **Wrangler CLI**: Latest version for Cloudflare deployment
- **Git**: For version control

### Initial Project Setup
```bash
# Clone repository
git clone <repository-url>
cd valet-system-poc

# Install dependencies
npm install

# Generate TypeScript types for Cloudflare
npm run cf-typegen

# Verify setup
npm run lint
```

### Environment Variables
```bash
# .env.local (not committed)
CONVEX_DEPLOYMENT=dev:your-deployment-name
CONVEX_AUTH_SECRET=your-secret-key

# Environment configuration is handled through:
# - Dockerfile for container environment
# - wrangler.jsonc for Cloudflare bindings
# - Convex dashboard for backend configuration
```

## Development Workflows

### 1. Local Development Workflow

#### Frontend Development
```bash
# Start development server with hot reload
npm run dev

# This starts:
# - Vite dev server on http://localhost:5173
# - Hot Module Replacement (HMR) enabled
# - TypeScript compilation in watch mode
# - Automatic browser refresh on changes
```

#### Backend Development
```bash
# Start Convex backend development
npm run dev:backend

# This provides:
# - Local Convex development server
# - Real-time function updates
# - Database schema synchronization
# - Authentication testing environment
```

#### Full Stack Development
```bash
# Setup complete development environment
npm run predev

# This command:
# 1. Starts Convex dev server
# 2. Waits for successful connection
# 3. Runs setup script
# 4. Opens Convex dashboard
# 5. Ready for npm run dev
```

### 2. Code Quality Workflow

#### Pre-commit Checklist
```bash
# 1. Run linter (MANDATORY)
npm run lint

# 2. Fix any linting errors
npm run lint --fix

# 3. Build verification
npm run build

# 4. Type checking
npx tsc --noEmit
```

#### Code Standards
- **TypeScript**: Strict mode, no `any` types
- **ESLint**: Enforced React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Import Organization**: Structured import statements

```typescript
// Preferred import structure
import React from 'react'                    // 1. Node modules
import { useCustomHook } from '@/hooks'      // 2. Internal hooks/utils
import { Button } from '@/components/ui'     // 3. Components
import type { ComponentProps } from '@/types' // 4. Types
```

### 3. Testing Workflows

#### Unit Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Integration Testing
```bash
# Test container locally
docker build -t convex-backend .
docker run -p 3210:3210 convex-backend

# Test API endpoints
curl http://localhost:3210/

# Validate container health
docker exec <container-id> curl http://localhost:3210/
```

#### End-to-End Testing
```bash
# Run E2E tests
npm run test:e2e

# Test specific scenarios
npm run test:e2e -- --spec="auth-flow"
```

### 4. Component Development Workflow

#### shadcn/ui Integration (Planned)
```bash
# Initialize shadcn/ui (when implemented)
npx shadcn@latest init

# Add components
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add dialog

# Verify component integration
npm run dev
```

#### Component Creation Pattern
```typescript
// components/ui/custom-component.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CustomComponentProps {
  // Define props with TypeScript
}

const CustomComponent = React.forwardRef<
  HTMLDivElement,
  CustomComponentProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("base-styles", className)}
      {...props}
    />
  )
})
CustomComponent.displayName = "CustomComponent"

export { CustomComponent }
```

### 5. API Development Workflow

#### Worker Development
```typescript
// worker/index.ts pattern
export class Container extends DurableObject<Env> {
  async fetch(req: Request) {
    try {
      // Implement request handling
      return Response.json({ success: true })
    } catch (error) {
      // Proper error handling
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }
  }
}
```

#### Convex Function Development
```typescript
// convex/functions.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createItem = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Implement function logic
    return await ctx.db.insert("items", args);
  },
});
```

### 6. Build and Deployment Workflows

#### Build Process
```bash
# Build frontend and worker
npm run build

# This executes:
# 1. TypeScript compilation (tsc -b)
# 2. Vite build for frontend assets
# 3. Worker bundle creation
# 4. Asset optimization
```

#### Preview Build
```bash
# Build and preview locally
npm run preview

# This provides:
# - Production build testing
# - Static asset serving
# - Performance validation
```

#### Deployment Process
```bash
# Deploy to Cloudflare
npm run deploy

# This executes:
# 1. npm run build
# 2. wrangler deploy
# 3. Container image upload
# 4. Global distribution
```

### 7. Container Development Workflow

#### Local Container Development
```bash
# Build container image
docker build -t convex-backend .

# Run container locally
docker run -p 3210:3210 -p 3211:3211 convex-backend

# Test container endpoints
curl http://localhost:3210/
curl http://localhost:3211/
```

#### Container Debugging
```bash
# View container logs
docker logs <container-id>

# Interactive container access
docker exec -it <container-id> /bin/sh

# Monitor container performance
docker stats <container-id>
```

### 8. Monitoring and Debugging Workflows

#### Development Monitoring
```bash
# Monitor Cloudflare deployment
wrangler tail

# Monitor local development
# - Browser DevTools for frontend
# - Convex dashboard for backend
# - Docker logs for containers
```

#### Production Debugging
```bash
# Real-time log monitoring
wrangler tail --env production

# Container health checks
curl https://your-domain.workers.dev/api/health

# Performance monitoring
# - Cloudflare Analytics dashboard
# - Convex metrics dashboard
```

### 9. Git Workflow

#### Branch Strategy
```bash
# Feature development
git checkout -b feature/component-name
git add .
git commit -m "feat: add new component"
git push origin feature/component-name

# Create pull request for review
```

#### Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

#### Pre-commit Hooks
```bash
# Automatic execution before commit:
# 1. npm run lint
# 2. TypeScript type checking
# 3. Test execution
# 4. Build verification
```

### 10. Performance Optimization Workflow

#### Frontend Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Performance profiling
# - React DevTools Profiler
# - Chrome DevTools Performance tab
# - Lighthouse audits
```

#### Backend Optimization
```bash
# Container optimization
docker image ls
docker history convex-backend

# Function performance
# - Convex dashboard metrics
# - Custom performance logging
```

### 11. Troubleshooting Workflows

#### Container Port Access Issues (Most Common)

**⚠️ Critical Issue: "container port not found" Error**

**Symptoms:**
- Error: "container port not found" 
- 502 Bad Gateway on `/api/*` routes
- Container builds successfully but endpoints fail

**Root Cause:** Missing `defaultPort` in Container class

**Solution:**
```typescript
// ✅ CORRECT: Container class with defaultPort
export class ConvexContainer extends Container {
    defaultPort = 3210;  // This is CRITICAL!
    sleepAfter = "30m";
    
    async fetch(request: Request) {
        return await this.containerFetch(request);
    }
}
```

**Testing Container Access:**
```bash
# 1. Start development server
npx wrangler dev

# 2. Test container endpoint (in new terminal)
curl http://localhost:8787/api/ -v

# Expected: HTTP 404 (not "container port not found")
# 404 means container is accessible, just no endpoints configured

# 3. Verify frontend works
curl http://localhost:8787/
# Expected: React HTML content
```

**Container Debugging Checklist:**
- [ ] Container class has `defaultPort = 3210` property
- [ ] Using simple `containerFetch(request)` (no manual port parameter) 
- [ ] No manual container lifecycle management in constructor
- [ ] No manual state checking in fetch method
- [ ] Getting HTTP responses (not "container port not found")

#### Other Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

**Deployment Issues**
```bash
# Verify Wrangler authentication
wrangler whoami

# Check deployment status
wrangler deployments list

# Retry deployment
npm run deploy
```

**Development Server Issues**
```bash
# Stop any running wrangler processes
pkill -f "wrangler dev"

# Restart development server
npx wrangler dev

# Note: wrangler dev runs indefinitely (use Ctrl+C to stop)
```

**Container State Debugging**
```bash
# View container logs in real-time
npx wrangler tail

# Check container configuration
cat wrangler.jsonc | grep -A 10 containers

# Verify Dockerfile is minimal
cat Dockerfile
```

See [Cloudflare Containers Troubleshooting Guide](./cloudflare-containers-troubleshooting.md) for comprehensive debugging information.

### 12. Documentation Workflow

#### Code Documentation
```typescript
/**
 * Custom hook for managing user authentication state
 * @param initialState - Initial authentication state
 * @returns Authentication state and control functions
 * @example
 * const { user, signIn, signOut } = useAuth()
 */
export function useAuth(initialState = null) {
  // Implementation
}
```

#### API Documentation
```typescript
/**
 * POST /api/users
 * Creates a new user account
 * 
 * @body {
 *   name: string;
 *   email: string;
 * }
 * 
 * @returns {
 *   id: string;
 *   name: string;
 *   email: string;
 *   createdAt: string;
 * }
 */
```

### 13. Continuous Integration Workflow

#### GitHub Actions (Example)
```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run linter
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Build project
        run: npm run build
```

## Best Practices Summary

### Daily Development Routine
1. Pull latest changes from main branch
2. Run `npm run lint` before any code changes
3. Use `npm run dev` for frontend development
4. Use `npm run dev:backend` for backend development
5. Test changes locally before committing
6. Run full build verification before pushing

### Weekly Maintenance
1. Update dependencies and check for security vulnerabilities
2. Review and update documentation
3. Performance audit and optimization
4. Backup and cleanup development environment
5. Review and merge pending pull requests

### Monthly Reviews
1. Architecture review and optimization opportunities
2. Security audit and dependency updates
3. Performance benchmarking and optimization
4. Documentation completeness review
5. Workflow efficiency assessment

This comprehensive workflow documentation ensures consistent, high-quality development practices across the entire team and project lifecycle.