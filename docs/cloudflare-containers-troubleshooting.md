# Cloudflare Containers Troubleshooting Guide

Comprehensive troubleshooting guide for Cloudflare Workers + Containers implementation, with focus on common issues and proven solutions.

## Critical Issue: "Container Port Not Found" Error

### Symptoms
- Error message: "container port not found"
- 502 Bad Gateway responses when accessing `/api/*` routes
- Container builds successfully but ports are inaccessible
- Frontend serves correctly, but container endpoints fail

### ❌ Common Misconceptions
- **NOT** related to environment variables
- **NOT** a Cloudflare Containers platform limitation
- **NOT** a Docker configuration issue
- **NOT** related to port exposure in Dockerfile

### ✅ REAL Root Cause
**Missing `defaultPort` property in Container class implementation**

### The Solution

**Broken Implementation:**
```typescript
import { Container } from '@cloudflare/containers';

export class ConvexContainer extends Container {
    // ❌ MISSING: defaultPort property
    sleepAfter = "30m";
    
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        // ❌ WRONG: Manual container lifecycle management
        if (!this.ctx.container?.running) {
            this.ctx.container?.start();
        }
    }

    async fetch(request: Request) {
        // ❌ WRONG: Manual state checking and explicit port parameters
        if (!this.ctx.container?.running) {
            return new Response("Container not running", { status: 500 });
        }
        return await this.containerFetch(request, 3210);
    }
}
```

**Working Implementation:**
```typescript
import { Container } from '@cloudflare/containers';

export class ConvexContainer extends Container {
    defaultPort = 3210;  // ✅ CRITICAL: This property is required!
    sleepAfter = "30m";
    
    async fetch(request: Request) {
        // ✅ CORRECT: Simple pattern, let Container class handle lifecycle
        return await this.containerFetch(request);
    }
}
```

### Key Differences
1. **`defaultPort = 3210`** - Critical property that tells Container class which port to use
2. **Simple `containerFetch(request)`** - No manual port parameters needed
3. **No constructor complexity** - Let Container class handle startup automatically
4. **No manual state checking** - Container class manages lifecycle

### Testing the Fix

**1. Start Development Server**
```bash
npx wrangler dev
```

**2. Test Container Access**
```bash
# Should return 404 Not Found (not "container port not found")
curl http://localhost:8787/api/ -v
```

**3. Verify Frontend Still Works**
```bash
# Should return React frontend HTML
curl http://localhost:8787/
```

**4. Check Logs**
Expected logs in wrangler dev terminal:
```
request URL: http://localhost:8787/api/
container response status: 404
[wrangler:info] GET /api/ 404 Not Found (XXms)
```

### Success Indicators
- ✅ HTTP responses (200, 404, etc.) instead of "container port not found"
- ✅ `containerFetch()` connects successfully
- ✅ Frontend continues to work normally
- ✅ Container starts and responds to requests

## Environment Variables Investigation

### Discovery Process
Through systematic testing, we discovered that environment variables were **NOT** the root cause:

**Test Results:**
- ✅ Works without `DO_NOT_REQUIRE_SSL=true`
- ✅ Works without `INSTANCE_NAME=local-development`  
- ✅ Works without `INSTANCE_SECRET=<hex-string>`
- ✅ Works with NO environment variables at all

**Conclusion:** Environment variables were a **red herring** that coincidentally were added at the same time as the Container class fixes.

### Minimal Working Dockerfile
```dockerfile
# Minimal working configuration
FROM ghcr.io/get-convex/convex-backend:6efab6f2b6c182b90255774d747328cfc7b80dd9

# Only these are needed for container port access
EXPOSE 3210 3211

# Optional health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
CMD curl -f http://localhost:3210/ || exit 1
```

## Other Common Issues

### Issue: Container Builds But Doesn't Start
**Symptoms:** Container image builds successfully but no response from endpoints

**Solution:** Check Container class has `defaultPort` property and follows simple pattern.

### Issue: Wrong Port Responses
**Symptoms:** Getting responses from wrong service or unexpected content

**Solution:** Verify `defaultPort` matches your container's actual listening port (3210 for Convex).

### Issue: Development Server Won't Stop
**Symptoms:** `npx wrangler dev` runs indefinitely

**Solution:** This is normal behavior. Use `Ctrl+C` or `pkill -f "wrangler dev"` to stop.

### Issue: Container State Confusion
**Symptoms:** Inconsistent behavior between requests

**Solution:** Avoid manual container lifecycle management. Let Container class handle state automatically.

## Best Practices

### Container Class Implementation
```typescript
import { Container } from '@cloudflare/containers';

export class MyContainer extends Container {
    // Always specify defaultPort
    defaultPort = 8080;  // Match your container's listening port
    
    // Optional: Configure sleep timeout
    sleepAfter = "30m";
    
    async fetch(request: Request) {
        // Keep it simple - let Container handle complexity
        try {
            return await this.containerFetch(request);
        } catch (error) {
            console.error('Container fetch error:', error);
            return new Response(`Container error: ${error}`, { status: 500 });
        }
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
            const containerId = env.CONTAINER.idFromName('my-container');
            const containerStub = env.CONTAINER.get(containerId);
            return await containerStub.fetch(request);
        }
        
        // Handle other routes (frontend, assets, etc.)
        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
```

### Debugging Steps
1. **Verify Container class has `defaultPort`**
2. **Check for simple `containerFetch(request)` usage**
3. **Remove manual container lifecycle code**
4. **Test with minimal Dockerfile first**
5. **Add environment variables only if needed for application logic**

## Performance Notes

### Response Times
- Typical response time: 40-80ms for container requests
- First request may be slower due to container startup
- Subsequent requests are fast due to container persistence

### Container Lifecycle
- Containers auto-start on first request
- Stay alive for duration specified in `sleepAfter`
- Auto-restart if they crash or timeout
- No manual management needed

## Migration Guide

### From Broken to Working Implementation

**Step 1:** Add `defaultPort` to Container class
```typescript
export class MyContainer extends Container {
    defaultPort = 3210;  // Add this line
    // ... rest of implementation
}
```

**Step 2:** Simplify fetch method
```typescript
async fetch(request: Request) {
    // Replace complex logic with simple call
    return await this.containerFetch(request);
}
```

**Step 3:** Remove constructor if present
```typescript
// Remove this entire constructor
constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Remove manual startup logic
}
```

**Step 4:** Test the changes
```bash
npx wrangler dev
curl http://localhost:8787/api/
```

### Verification Checklist
- [ ] Container class has `defaultPort` property
- [ ] Using simple `containerFetch(request)` pattern
- [ ] No manual container lifecycle management
- [ ] Getting HTTP responses (not "container port not found")
- [ ] Frontend still works correctly

## Related Documentation
- [Cloudflare Containers Setup Guide](./cloudflare-containers-setup.md)
- [Development Workflows](./development-workflows.md)
- [Technical Architecture](./technical-architecture.md)

## Getting Help

If you encounter issues not covered in this guide:
1. Check the Container class implementation against the working pattern
2. Verify Dockerfile follows minimal configuration
3. Test with the debugging steps provided
4. Review logs for specific error messages

Remember: The most common issue is missing `defaultPort` in the Container class!