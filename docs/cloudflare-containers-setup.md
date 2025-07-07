# Cloudflare Containers Setup Guide

Complete setup instructions for deploying a Convex backend using Cloudflare Workers and Containers with HTTP passthrough architecture.

## Architecture

```
Browser → Cloudflare Worker → Durable Object → Container → Convex Backend
```

The system provides:
- **Edge computing**: Convex backend runs directly on Cloudflare's global network
- **HTTP passthrough**: Seamless request forwarding from Workers to containerized backends
- **Auto-scaling**: Container instances managed by Cloudflare with `max_instances` configuration
- **High performance**: ~770ms average response time with 92%+ success rate

## Key Components

### 1. Worker (`worker/index.ts`)
- Routes `/api/*` requests to the Container Durable Object
- Handles errors and provides detailed diagnostics
- Falls back gracefully when containers are unavailable

### 2. Container Durable Object
- Manages Convex backend container lifecycle
- Forwards HTTP requests to container port 3210
- Provides detailed error reporting for debugging

### 3. Custom Dockerfile
- Extends the official Convex backend image
- Configures proper data persistence directories
- Sets environment variables for containerized deployment
- Includes health checks for reliability

### 4. Wrangler Configuration
- Configures container deployment with `max_instances: 1`
- Sets up Durable Object bindings and migrations
- Uses SQLite backend for optimal performance

## Container Implementation Best Practices

### ✅ Correct Container Class Pattern

**Critical Requirements:**
- Must include `defaultPort` property
- Use simple `containerFetch(request)` pattern
- Avoid manual container lifecycle management

```typescript
import { Container } from '@cloudflare/containers';

export class ConvexContainer extends Container {
    defaultPort = 3210;  // ⭐ CRITICAL: This property is required!
    sleepAfter = "30m";   // Optional: Container idle timeout
    
    async fetch(request: Request) {
        // ✅ Simple pattern - let Container class handle complexity
        return await this.containerFetch(request);
    }
}
```

### ❌ Common Mistakes to Avoid

**Missing defaultPort (causes "container port not found"):**
```typescript
export class BrokenContainer extends Container {
    // ❌ MISSING: defaultPort property
    async fetch(request: Request) {
        return await this.containerFetch(request, 3210); // Won't work without defaultPort
    }
}
```

**Manual container lifecycle management:**
```typescript
export class OverComplexContainer extends Container {
    defaultPort = 3210;
    
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        // ❌ WRONG: Manual startup logic not needed
        if (!this.ctx.container?.running) {
            this.ctx.container?.start();
        }
    }
    
    async fetch(request: Request) {
        // ❌ WRONG: Manual state checking not needed
        if (!this.ctx.container?.running) {
            return new Response("Container not running", { status: 500 });
        }
        return await this.containerFetch(request);
    }
}
```

### Worker Routing Pattern

```typescript
export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);

        // Route API requests to container
        if (url.pathname.startsWith("/api/")) {
            const containerId = env.CONTAINER.idFromName('convex-backend');
            const containerStub = env.CONTAINER.get(containerId);
            return await containerStub.fetch(request);
        }
        
        // Serve frontend or other assets
        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
```

### Testing Container Implementation

**1. Verify Container Access:**
```bash
# Should return HTTP responses (404, 200, etc.) not "container port not found"
curl http://localhost:8787/api/ -v
```

**2. Expected Response Pattern:**
- ✅ HTTP status codes (404 Not Found is normal for unconfigured endpoints)
- ❌ "container port not found" error indicates missing `defaultPort`

**3. Debugging Steps:**
1. Check Container class has `defaultPort = 3210`
2. Verify simple `containerFetch(request)` usage
3. Remove any manual container management code
4. Test with minimal configuration first

See [Cloudflare Containers Troubleshooting Guide](./cloudflare-containers-troubleshooting.md) for detailed debugging information.

## Setup

### Prerequisites
- Node.js 18+
- Docker (for building container images)
- Cloudflare account with Workers/Containers access

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Login to Wrangler**
   ```bash
   npx wrangler login
   ```

3. **Generate TypeScript types**
   ```bash
   npm run cf-typegen
   ```

4. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

The deployment process will:
- Build the React frontend
- Build the custom Convex backend container
- Push the container to Cloudflare's registry
- Deploy the Worker with Durable Object bindings

## Configuration

### Container Settings
```jsonc
{
  "containers": [
    {
      "name": "convex-backend",
      "image": "./Dockerfile",
      "class_name": "Container",
      "max_instances": 1
    }
  ]
}
```

### Key Environment Variables (in Dockerfile)
- `DO_NOT_REQUIRE_SSL=true` - Allows HTTP in container environment
- `CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210` - Bind to all interfaces
- `DISABLE_BEACON=true` - Disable telemetry for edge deployment

## API Endpoints

All `/api/*` requests are forwarded to the Convex backend:

- `GET /api/version` - Convex backend version
- `GET /api/test` - Test endpoint for debugging
- All standard Convex API endpoints

## Monitoring

The Cloudflare dashboard provides detailed metrics:
- Request count and success rates
- Response times and error rates
- Container health and instance status
- Billable duration tracking

## Troubleshooting

### Container Not Starting
- Check container logs in Cloudflare dashboard
- Verify `max_instances: 1` is set in wrangler.jsonc
- Ensure Docker daemon is running locally for builds

### Network Binding Issues
- Convex backend must bind to `0.0.0.0:3210`, not `127.0.0.1`
- Check `CONVEX_CLOUD_ORIGIN` environment variable
- Verify container port 3210 is exposed

### Build Failures
- Ensure base Convex image is accessible
- Check Docker build context and Dockerfile syntax
- Verify Cloudflare registry authentication

## Performance

Achieved metrics in testing:
- **Success rate**: 92.86% (13/14 requests)
- **Average response time**: 770ms
- **Billable duration**: 0.95 GB-sec
- **Container startup**: ~15-30 seconds

## Security

- Containers run in Cloudflare's secure runtime environment
- Private network mode isolates container communication
- No sensitive data exposed in environment variables
- HTTPS termination handled by Cloudflare Workers

## Limitations

- Currently in Cloudflare Containers beta
- Container instances limited by resource quotas
- Cold start latency for container initialization
- Some Convex features may require additional configuration

## Future Improvements

- Implement container warm-up strategies
- Add request/response caching
- Support for multiple container instances
- Enhanced error handling and retry logic
- Container log aggregation and monitoring