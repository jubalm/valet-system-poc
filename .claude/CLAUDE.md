# Claude Project Memory

This file contains Claude-specific instructions and memory for the valet-init project.

**Note**: This serves as both project-specific memory and user global preferences for this development session.

## Project Architecture

This is a Cloudflare Workers + Containers application that implements HTTP passthrough from Workers to a containerized Convex backend. The architecture follows this pattern:

```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

## Key Implementation Details

### Container Configuration
- Use `max_instances: 1` in wrangler.jsonc for reliable container allocation
- Convex backend must bind to `0.0.0.0:3210`, not `127.0.0.1` 
- Container startup takes 15-30 seconds on first request
- Custom Dockerfile required to bypass public registry limitations

### Critical Environment Variables
- `DO_NOT_REQUIRE_SSL=true` - Allows HTTP in container environment
- `CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210` - Bind to all interfaces (not 127.0.0.1)
- `DISABLE_BEACON=true` - Disable telemetry for edge deployment

### Development Commands
- `npm run dev` - Local development with hot reload
- `npm run build` - Build both frontend and worker (`tsc -b && vite build`)
- `npm run lint` - Always run before commits
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare bindings

### Key Files for Claude
- `worker/index.ts` - Main Worker and DurableObject implementation
- `Dockerfile` - Custom Convex backend container configuration
- `wrangler.jsonc` - Cloudflare deployment configuration
- `tsconfig.worker.json` - Worker-specific TypeScript config

### Common Issues & Solutions
- **Container not starting**: Verify `max_instances: 1` in wrangler.jsonc
- **Network binding errors**: Check `CONVEX_CLOUD_ORIGIN` uses `0.0.0.0` not `127.0.0.1`
- **Registry timeouts**: Retry deployment, Cloudflare registry can be intermittent
- **Build failures**: Ensure Docker daemon running, check Dockerfile syntax

### Performance Metrics Achieved
- Success rate: 92.86% (13/14 requests in testing)
- Average response time: ~770ms
- Container startup: 15-30 seconds cold start

### Testing Strategy
- Test container locally first: `docker run -p 3210:3210 convex-backend`
- Use `wrangler tail` for real-time logging during deployment
- Monitor Cloudflare dashboard for container health and metrics

## Development Patterns
- Always test locally before deployment
- Use Durable Objects for container lifecycle management
- Implement proper error handling with diagnostics
- Follow SQLite-backed Durable Objects pattern for performance

## Global Development Preferences

### Code Style Standards
- **TypeScript**: Strict mode, no `any` types, prefer interfaces for objects
- **React**: Functional components with hooks, proper error boundaries
- **Imports**: Organize as: node_modules → internal hooks → components → types
- **Naming**: kebab-case directories, PascalCase components, camelCase utilities

### shadcn/ui Integration Preferences
- Use latest component variants with composition over configuration
- Customize via CSS variables, use Tailwind for one-off styling
- Always validate components work with React 19 concurrent features

### Error Handling Standards
```typescript
// Frontend: Proper error typing and handling
try {
  const result = await apiCall()
  return result
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific errors
  }
  throw error
}

// Backend: Proper HTTP status codes
return Response.json(
  { error: 'Resource not found' },
  { status: 404 }
)
```

### Security Best Practices
- Never commit secrets, use proper environment validation
- Server-side authentication validation with CSRF protection
- Input validation with TypeScript contracts and sanitization

### Documentation Standards
- Comment complex business logic, not obvious code
- Use JSDoc for public APIs with usage examples
- Include architecture diagrams and troubleshooting guides