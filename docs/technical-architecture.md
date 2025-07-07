# Technical Architecture Documentation

## System Overview

The Valet System PoC implements a modern edge computing architecture that combines the best of frontend frameworks with innovative backend patterns. The system demonstrates HTTP passthrough from Cloudflare Workers to containerized backends, providing global scalability and performance.

## Architecture Layers

### 1. Presentation Layer (Frontend)

#### Technology Stack
- **React 19**: Latest React with concurrent features and server components
- **TypeScript**: Strict typing for enhanced development experience
- **Vite**: Ultra-fast build tool with Hot Module Replacement (HMR)
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework

#### Component Architecture
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── assets/              # Static assets
```

#### State Management Strategy
- **Local State**: useState and useReducer for component state
- **Server State**: Convex real-time subscriptions
- **Global State**: React Context for app-wide state
- **Form State**: React Hook Form with TypeScript validation

### 2. Edge Computing Layer (Cloudflare Workers)

#### Worker Architecture
```typescript
// worker/index.ts
export class Container extends DurableObject<Env> {
  // Container lifecycle management
  // HTTP passthrough to containerized backend
  // Error handling and fallbacks
}

export default {
  async fetch(request, env): Promise<Response> {
    // Route handling and request forwarding
  }
} satisfies ExportedHandler<Env>
```

#### Request Flow
1. **Request Reception**: Worker receives HTTP request
2. **Route Analysis**: Determine if request is for API (`/api/*`) or static assets
3. **Durable Object**: Forward API requests to Container Durable Object
4. **Container Proxy**: Proxy request to containerized Convex backend
5. **Response Handling**: Return response with proper error handling

#### Performance Characteristics
- **Cold Start**: < 100ms for Workers
- **Geographic Distribution**: 300+ edge locations globally
- **Concurrency**: Handles thousands of concurrent requests per location
- **Auto-scaling**: Scales to zero when idle

### 3. Orchestration Layer (Durable Objects)

#### Container Management
```typescript
class Container extends DurableObject<Env> {
  container?: globalThis.Container;
  
  constructor(ctx: DurableObjectState, env: Env) {
    this.container = ctx.container;
    if (this.container && !this.container.running) {
      this.container.start();
    }
  }
  
  async fetch(req: Request) {
    return await this.container.getTcpPort(3210).fetch(req.url, req);
  }
}
```

#### Key Features
- **Lifecycle Management**: Automatic container start/stop
- **Health Monitoring**: Container health checks and restart logic
- **Request Proxying**: TCP port forwarding to container services
- **State Persistence**: SQLite-backed state storage
- **Geographic Placement**: Co-located with container instances

### 4. Compute Layer (Cloudflare Containers)

#### Container Configuration
```dockerfile
FROM ghcr.io/get-convex/convex-backend:6efab6f2b6c182b90255774d747328cfc7b80dd9

ENV DO_NOT_REQUIRE_SSL=true
ENV RUST_LOG=info
ENV INSTANCE_NAME=cloudflare-container
ENV CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210
ENV CONVEX_SITE_ORIGIN=http://0.0.0.0:3211
ENV DISABLE_BEACON=true

EXPOSE 3210 3211
```

#### Integration Patterns
- **API Gateway Pattern**: Workers control routing and auth before container access
- **Service Mesh Pattern**: Private connections between containers
- **Orchestrator Pattern**: Custom scheduling and scaling logic
- **Hybrid Architecture**: Edge handles routing/auth, containers provide compute

#### Performance Metrics
- **Cold Start**: 15-30 seconds for container initialization
- **Memory Usage**: Optimized for edge deployment constraints
- **CPU Efficiency**: Rust-based backend for high performance
- **Network Latency**: Sub-regional container placement

### 5. Data Layer (Convex Backend)

#### Convex Architecture
```typescript
// convex/schema.ts
export default defineSchema({
  ...authTables,          // Authentication tables
  numbers: defineTable({  // Application data
    value: v.number(),
  }),
});
```

#### Real-time Features
- **WebSocket Connections**: Live data synchronization
- **Reactive Queries**: Automatic UI updates on data changes
- **Optimistic Updates**: Instant UI feedback
- **Conflict Resolution**: Automatic conflict resolution

#### Authentication System
```typescript
// convex/auth.ts
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Authentication providers configuration
  ],
});
```

## Integration Architecture

### Frontend-Backend Communication

#### API Routes
```
/api/*                  → Cloudflare Worker → Container → Convex
/auth/*                 → Convex Auth endpoints
/realtime              → WebSocket connection to Convex
```

#### Data Flow
1. **Frontend Request**: React component initiates API call
2. **Worker Routing**: Cloudflare Worker receives and routes request
3. **Container Proxy**: Durable Object forwards to container
4. **Backend Processing**: Convex processes request and updates database
5. **Real-time Updates**: Changes propagated via WebSocket to all clients
6. **UI Updates**: React components re-render with new data

### Security Architecture

#### Authentication Flow
```
User Login → Convex Auth → JWT Token → Worker Validation → Container Access
```

#### Security Layers
- **Edge Security**: Cloudflare's global security features
- **Worker Validation**: Request validation and rate limiting
- **Container Isolation**: Secure sandbox environment
- **Data Encryption**: HTTPS/WSS for all communications
- **Access Control**: Fine-grained permissions via Convex Auth

### Deployment Architecture

#### Build Pipeline
```bash
# Frontend Build
tsc -b && vite build

# Type Generation
wrangler types

# Deployment
wrangler deploy
```

#### Infrastructure as Code
```jsonc
// wrangler.jsonc
{
  "containers": [{
    "name": "convex-backend",
    "image": "./Dockerfile",
    "class_name": "Container",
    "max_instances": 1
  }],
  "durable_objects": {
    "bindings": [{
      "class_name": "Container",
      "name": "CONTAINER"
    }]
  }
}
```

## Scalability Considerations

### Horizontal Scaling
- **Geographic Distribution**: Automatic deployment to 300+ locations
- **Container Replication**: Multiple container instances per region
- **Load Balancing**: Automatic request distribution
- **Auto-scaling**: Scale to zero during idle periods

### Performance Optimization
- **Edge Caching**: Static asset caching at edge locations
- **API Optimization**: Response caching and compression
- **Container Optimization**: Minimal container images and fast startup
- **Database Optimization**: Convex's built-in query optimization

### Monitoring and Observability
- **Real-time Metrics**: Container health and performance monitoring
- **Error Tracking**: Comprehensive error logging and alerts
- **Performance Monitoring**: Request latency and throughput metrics
- **Cost Monitoring**: Usage-based cost tracking and optimization

## Development Workflow

### Local Development
```bash
npm run dev          # Frontend development with HMR
npm run dev:backend  # Convex backend development
```

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and container integration
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load testing and optimization

### Deployment Process
1. **Code Review**: Pull request with automated checks
2. **Build Validation**: TypeScript compilation and linting
3. **Container Build**: Docker image creation and validation
4. **Deployment**: Automated deployment via Wrangler
5. **Monitoring**: Post-deployment health checks

## Future Architecture Considerations

### Planned Enhancements
- **Multi-region Database**: Geographic data distribution
- **Advanced Caching**: Redis integration for complex caching strategies
- **Microservices**: Container decomposition for specific services
- **AI Integration**: Edge AI inference capabilities

### Scalability Roadmap
- **Traffic Handling**: Support for millions of concurrent users
- **Data Volume**: Petabyte-scale data handling capabilities
- **Geographic Expansion**: Additional edge locations and regions
- **Service Mesh**: Advanced inter-service communication patterns

This architecture provides a solid foundation for building modern, globally distributed applications that leverage the best of edge computing and real-time backend technologies.