# Convex Self-Hosting on Cloudflare Containers: Challenges & Solutions

## Overview

This document analyzes the specific challenges of self-hosting Convex backend on Cloudflare Containers and provides concrete workarounds and implementation strategies. The analysis is based on research of both platforms' capabilities and limitations.

## 🏗️ Architecture Comparison

### Standard Convex Self-Hosting Architecture
```
Frontend → Convex Backend → Local SQLite/PostgreSQL/MySQL
                         → Local/S3 File Storage
                         → Dashboard (Port 6791)
```

### Cloudflare Containers Constraint Architecture
```
Frontend → Worker → Durable Object → Container (Convex) → External Database
                                  → R2 File Storage
                                  → No Direct Dashboard Access
```

## 🚨 Critical Compatibility Issues

### 1. Database Persistence Challenge

**Problem**: Convex defaults to SQLite, but Cloudflare Containers have ephemeral storage.

**Current Configuration** (from existing Dockerfile):
```dockerfile
# This configuration will FAIL due to ephemeral storage
ENV CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210
ENV CONVEX_SITE_ORIGIN=http://0.0.0.0:3211
RUN mkdir -p /convex/data /convex/data/tmp  # Will be lost on restart
```

**Required Changes**:
```dockerfile
# Add external database configuration
ENV DATABASE_URL=postgresql://user:pass@host:5432/convex_self_hosted
ENV INSTANCE_SECRET=<generated-secret>
# Remove local data directory creation
```

**Implementation Strategy**:
1. **External PostgreSQL**: Use Neon, PlanetScale, or Supabase
2. **Regional Placement**: Ensure database in same region as likely container placement
3. **Connection Pooling**: Implement connection management for container scaling

### 2. File Storage Migration

**Convex Default Storage Structure**:
```bash
/convex/data/
├── exports/          # Backup exports
├── modules/          # Compiled function modules  
├── files/            # User uploaded files
└── search_indexes/   # Search index data
```

**Cloudflare R2 Integration Strategy**:
```dockerfile
# Add S3-compatible R2 configuration
ENV AWS_ENDPOINT_URL=https://account.r2.cloudflarestorage.com
ENV AWS_ACCESS_KEY_ID=<r2-access-key>
ENV AWS_SECRET_ACCESS_KEY=<r2-secret-key>
ENV EXPORTS_BUCKET=convex-exports
ENV MODULES_BUCKET=convex-modules
ENV FILES_BUCKET=convex-files
ENV SEARCH_INDEXES_BUCKET=convex-search
```

### 3. Port Access and Dashboard Issues

**Standard Convex Ports**:
- **3210**: Backend API (✅ Can proxy through Worker)
- **3211**: HTTP Actions (✅ Can proxy through Worker)  
- **6791**: Admin Dashboard (❌ No direct access)

**Dashboard Access Solution**:
```typescript
// worker/index.ts - Add dashboard proxy
if (url.pathname.startsWith("/dashboard/")) {
  return await env.CONTAINER.get(
    env.CONTAINER.idFromName('convex-backend')
  ).fetch(
    new Request(url.toString().replace("/dashboard/", "/"), request)
  );
}
```

## 🔧 Implementation Roadmap

### Phase 1: Database Migration (Week 1)

**Objective**: Move from SQLite to external PostgreSQL

**Steps**:
1. **Database Setup**:
   ```bash
   # Create Neon/PlanetScale database
   # Database name MUST be: convex_self_hosted
   ```

2. **Update Dockerfile**:
   ```dockerfile
   FROM ghcr.io/get-convex/convex-backend:latest
   
   # Remove SQLite configuration
   # ENV DO_NOT_REQUIRE_SSL=true  # Remove for production
   
   # Add PostgreSQL configuration
   ENV DATABASE_URL=postgresql://user:pass@host:5432/convex_self_hosted
   ENV INSTANCE_SECRET=<generated-256-bit-secret>
   ENV INSTANCE_NAME=cloudflare-container
   
   # Keep essential networking config
   ENV CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210
   ENV CONVEX_SITE_ORIGIN=http://0.0.0.0:3211
   ENV DISABLE_BEACON=true
   
   EXPOSE 3210 3211 6791
   ```

3. **Test Migration**:
   ```bash
   # Local testing with external database
   docker build -t convex-backend-external .
   docker run -p 3210:3210 convex-backend-external
   ```

### Phase 2: R2 Storage Integration (Week 2)

**Objective**: Replace local file storage with R2 buckets

**R2 Bucket Setup**:
```bash
# Create R2 buckets via Wrangler
wrangler r2 bucket create convex-exports
wrangler r2 bucket create convex-modules  
wrangler r2 bucket create convex-files
wrangler r2 bucket create convex-search-indexes
```

**Update Container Configuration**:
```dockerfile
# Add R2 S3-compatible configuration
ENV AWS_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
ENV AWS_ACCESS_KEY_ID=<r2-access-key>
ENV AWS_SECRET_ACCESS_KEY=<r2-secret-key>
ENV AWS_REGION=auto

# Convex S3 bucket configuration
ENV EXPORTS_BUCKET=convex-exports
ENV MODULES_BUCKET=convex-modules
ENV USER_FILES_BUCKET=convex-files
ENV SEARCH_INDEXES_BUCKET=convex-search-indexes
```

**Wrangler R2 Bindings** (if needed):
```jsonc
// wrangler.jsonc
{
  "r2_buckets": [
    { "binding": "CONVEX_EXPORTS", "bucket_name": "convex-exports" },
    { "binding": "CONVEX_MODULES", "bucket_name": "convex-modules" },
    { "binding": "CONVEX_FILES", "bucket_name": "convex-files" },
    { "binding": "CONVEX_SEARCH", "bucket_name": "convex-search-indexes" }
  ]
}
```

### Phase 3: Enhanced Networking (Week 3)

**Worker Enhancements**:
```typescript
// worker/index.ts
export class Container extends DurableObject<Env> {
  async fetch(req: Request) {
    const url = new URL(req.url);
    
    // Route different Convex services
    if (url.pathname.startsWith("/api/")) {
      // Backend API (port 3210)
      return await this.container.getTcpPort(3210).fetch(req.url, req);
    } else if (url.pathname.startsWith("/http/")) {
      // HTTP Actions (port 3211)  
      return await this.container.getTcpPort(3211).fetch(req.url, req);
    } else if (url.pathname.startsWith("/dashboard/")) {
      // Admin Dashboard (port 6791)
      const dashboardUrl = req.url.replace("/dashboard/", "/");
      return await this.container.getTcpPort(6791).fetch(dashboardUrl, req);
    }
    
    return new Response("Not Found", { status: 404 });
  }
}
```

### Phase 4: Production Hardening (Week 4)

**Secrets Management**:
```bash
# Store secrets securely
wrangler secret put DATABASE_URL
wrangler secret put INSTANCE_SECRET
wrangler secret put AWS_SECRET_ACCESS_KEY
```

**Enhanced Error Handling**:
```typescript
// Implement comprehensive fallbacks
async fetch(req: Request) {
  try {
    if (this.container) {
      return await this.container.getTcpPort(3210).fetch(req.url, req);
    }
  } catch (containerErr) {
    // Log error details
    console.error('Container error:', containerErr);
    
    // Return detailed error response
    return Response.json({
      error: "Container unavailable",
      message: containerErr.message,
      timestamp: new Date().toISOString(),
      retryAfter: 30
    }, { status: 503 });
  }
}
```

## ⚠️ Known Issues & Workarounds

### 1. Cold Start Impact on Real-time Features

**Issue**: 2-3 second container startup breaks real-time experience.

**Workaround Strategy**:
```typescript
// Implement keep-alive mechanism
export class Container extends DurableObject {
  private keepAliveTimer?: any;
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.scheduleKeepAlive();
  }
  
  private scheduleKeepAlive() {
    // Ping container every 5 minutes to prevent sleep
    this.keepAliveTimer = setInterval(async () => {
      if (this.container) {
        try {
          await this.container.getTcpPort(3210).fetch("/health");
        } catch (err) {
          console.warn('Keep-alive failed:', err);
        }
      }
    }, 5 * 60 * 1000);
  }
}
```

### 2. Database Latency Cross-Region

**Issue**: External database may be in different region than container.

**Mitigation**:
1. **Regional Database Selection**: Choose database provider with global distribution
2. **Connection Pooling**: Implement efficient connection management
3. **Caching Strategy**: Use Durable Objects for frequently accessed data

```typescript
// Cache critical data in Durable Object
export class Container extends DurableObject {
  private cache = new Map<string, any>();
  
  async getCachedData(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Fetch from container if not cached
    const response = await this.container.getTcpPort(3210)
      .fetch(`/api/data/${key}`);
    const data = await response.json();
    
    this.cache.set(key, data);
    return data;
  }
}
```

### 3. Resource Constraints for Large Datasets

**Issue**: Maximum 4GB RAM may be insufficient.

**Strategies**:
1. **Data Partitioning**: Split large datasets across multiple containers
2. **Lazy Loading**: Implement on-demand data loading
3. **External Processing**: Use R2 for large file processing

### 4. Rolling Deployment Complexity

**Issue**: Worker and Container deploy asynchronously.

**Solution**:
```typescript
// Version-aware routing
export class Container extends DurableObject {
  async fetch(req: Request) {
    const headers = req.headers;
    const workerVersion = headers.get('Worker-Version');
    const containerVersion = await this.getContainerVersion();
    
    if (workerVersion && workerVersion > containerVersion) {
      // Use backwards-compatible API
      return await this.handleLegacyRequest(req);
    }
    
    return await this.handleCurrentRequest(req);
  }
}
```

## 📊 Performance Expectations

### Realistic Metrics (Based on Constraints)

**Cold Start Scenarios**:
- First request: 2-3 seconds + database connection time
- Subsequent requests: Normal latency if container stays warm

**Database Performance**:
- Same region: 10-50ms query latency
- Cross region: 100-300ms query latency  
- Connection establishment: 50-200ms

**File Storage**:
- R2 access: 50-200ms for small files
- Large file uploads: Depends on user connection + R2 performance

**Recommended SLAs**:
- API Response Time: < 1 second (excluding cold starts)
- File Upload: < 10 seconds for files < 10MB
- Real-time Updates: < 500ms (when container warm)

## 🎯 Success Criteria

### Minimum Viable Implementation
- [ ] Container starts successfully with external database
- [ ] Basic CRUD operations work through Worker proxy
- [ ] File upload/download through R2 integration
- [ ] Dashboard accessible through Worker proxy

### Production Ready Implementation  
- [ ] Sub-second response times for warm containers
- [ ] Graceful handling of cold starts
- [ ] Comprehensive error handling and logging
- [ ] Monitoring and alerting for all components
- [ ] Backup and disaster recovery procedures

### Performance Targets
- [ ] 95% of requests < 1 second (excluding cold starts)
- [ ] 99.9% uptime for the overall system
- [ ] Data consistency across all storage systems
- [ ] Successful handling of concurrent users

This implementation strategy provides a roadmap for successfully deploying Convex backend on Cloudflare Containers while working around the platform's current limitations.