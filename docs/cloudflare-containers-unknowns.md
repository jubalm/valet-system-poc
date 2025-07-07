# Cloudflare Containers: Unknowns, Limitations & Challenges

## Executive Summary

This document captures the critical unknowns, limitations, and challenges discovered during research for self-hosting Convex backend on Cloudflare Containers. These findings are essential for making informed architectural decisions and setting realistic expectations for the PoC implementation.

**Status**: Cloudflare Containers is in public beta as of June 2025 with significant limitations that impact production readiness.

## 🚨 Critical Limitations Discovered

### 1. Ephemeral Storage (CRITICAL)
**Issue**: All container disks are ephemeral and reset on restart.
```
"All container disks are ephemeral. If a container sleeps and restarts 
it will have a fresh disk. Persistent disks are not slated for the near future."
```

**Impact on Convex**:
- SQLite database will be lost on container restart
- Convex data persistence requires external database or storage
- Local file storage for exports/modules not viable

**Current Workarounds**:
- Use external PostgreSQL/MySQL database
- Implement R2 for file storage (exports, modules, indexes)
- Store critical state in Durable Objects

### 2. Resource Constraints
**Available Instance Types** (Beta 2025):
- **dev**: 256 MB RAM, 1/16th vCPU
- **basic**: 1 GB RAM, 1/4 vCPU  
- **standard**: 4 GB RAM, 1/2 vCPU

**Limitations**:
- Maximum 4 GB RAM may be insufficient for large datasets
- Fractional vCPU allocation limits processing power
- No GPU support in current beta
- Architecture must be `linux/amd64`

**Unknown**: How these constraints affect Convex performance with realistic workloads.

### 3. Cold Start Latency
**Issue**: Container startup takes 2-3 seconds consistently.
```
"Cold starts typically complete in 2-3 seconds, which is remarkable 
for full container boot times."
```

**Impact**:
- 2-3 second delay unacceptable for real-time applications
- First user request to a sleeping container experiences significant latency
- May require keep-alive strategies to maintain performance

**Mitigation Strategies**:
- Implement container warm-up mechanisms
- Use Durable Objects for low-latency fallbacks
- Design for graceful degradation during cold starts

## 🌐 Networking & Geographic Challenges

### 4. Container Placement Issues
**Problem**: Containers may start far from users or Durable Objects.
```
"There are times in which you may request a new container and it will 
be started in a location that farther from the end user than is desired."
```

**Current Issues**:
- Container location optimized for first request only
- Subsequent requests from different regions experience latency
- Durable Objects often NOT co-located with containers
- No manual control over container placement

**Convex Impact**:
- Database latency critical for Convex (<1ms ideal)
- Cross-region database queries will be slow
- May need regional database deployment strategy

### 5. Co-location Problems
**Issue**: Durable Objects and Containers often in different locations.
```
"Currently, Durable Objects may be co-located with their associated 
Container instance, but often are not."
```

**Workaround in Progress**:
- Cloudflare working on expanding Durable Object locations
- Goal: Always run containers in same location as Durable Object
- Timeline: Unknown

## 🚀 Deployment & Operations Challenges

### 6. Rolling Deployment Complexity
**Problem**: Worker and Container deployments are asynchronous.
```
"When deploying a Container with wrangler deploy, the Worker code will 
be immediately updated while the Container code will slowly be updated 
using a rolling deploy."
```

**Requirements**:
- Worker code must be backwards compatible with old Container code
- Complex versioning and compatibility management
- Potential for split-brain scenarios during deployment

**Risk Level**: High for production deployments

### 7. Limited Observability (Beta)
**Current State**: Limited debugging and monitoring tools available.

**Unknowns**:
- Log aggregation capabilities
- Performance monitoring tools
- Debug access to containers
- Error tracking and alerting

**Production Readiness**: Questionable for critical workloads

## 💾 Database & Storage Challenges

### 8. Database Persistence Strategy
**Convex Requirements**:
- SQLite (default) - NOT viable due to ephemeral storage
- PostgreSQL/MySQL - Requires external hosting
- Co-location critical for performance (<1ms queries)

**Options**:
1. **Neon/PlanetScale**: External PostgreSQL with global distribution
2. **Cloudflare D1**: SQLite-compatible but different API
3. **Durable Objects**: For critical state, limited storage

**Unknown**: Performance impact of cross-region database calls

### 9. File Storage Integration
**Convex Storage Needs**:
- Exports bucket
- Snapshot imports bucket  
- Modules bucket
- User files bucket
- Search indexes bucket

**R2 Integration Status**:
```
"R2 bucket mounting will provide object storage access as a filesystem."
```

**Current State**: Filesystem mounting not yet available
**Workaround**: HTTP API integration with R2

## 🔧 Technical Architecture Unknowns

### 10. Port and Networking Configuration
**Convex Ports**:
- 3210: Backend API
- 3211: HTTP Actions
- 6791: Dashboard (admin)

**Container Networking**:
- Only HTTP access through Workers
- No direct TCP/UDP from end users
- Internal container communication unclear

**Unknown**: How to expose dashboard securely through Workers

### 11. Environment Variable & Secrets Management
**Required Configuration**:
```bash
# Critical for Convex
CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210
CONVEX_SITE_ORIGIN=http://0.0.0.0:3211
INSTANCE_NAME=cloudflare-container
INSTANCE_SECRET=<generated>
DATABASE_URL=<external-database>
```

**Unknowns**:
- Secure secrets management in Containers
- Environment variable injection methods
- Runtime configuration updates

### 12. Auto-scaling Behavior
**Current Feature**:
```
"There is an option for autoscaling, where additional instances are 
started if CPU usage exceed 75 percent of capacity."
```

**Unknowns**:
- How autoscaling affects database connections
- State management across multiple instances
- Load balancing between container instances
- Connection pooling and management

## 🎯 Specific Convex Integration Unknowns

### 13. Real-time Features Impact
**Convex Features Affected**:
- WebSocket connections for real-time updates
- Reactive queries and subscriptions
- Optimistic updates and conflict resolution

**Concerns**:
- WebSocket connection persistence across container restarts
- Session management with ephemeral storage
- Real-time performance with cold starts

### 14. Migration and Backup Strategies
**Requirements**:
- Database export/import for migrations
- Snapshot management for backups
- Version compatibility across deployments

**Unknowns**:
- Automated backup strategies with external database
- Migration tooling compatibility
- Disaster recovery procedures

## 📊 Performance Expectations

### 15. Realistic Performance Metrics
**Current Metrics** (from existing implementation):
- Success rate: 92.86% (13/14 requests)
- Average response time: ~770ms
- Container startup: 15-30 seconds cold start

**Unknowns**:
- Performance with external database
- Latency impact of R2 file storage
- Scaling characteristics under load
- Resource utilization patterns

## 🛡️ Security Considerations

### 16. Container Security Model
**Isolation**: VM-level isolation from other workloads
**Network Security**: Private by default, access through Workers only

**Unknowns**:
- Security scanning of custom images
- Vulnerability management processes
- Compliance certifications (SOC2, etc.)
- Network security between containers and external services

## 🔮 Future Roadmap & Timeline

### 17. Planned Features (No Timeline)
**Storage Improvements**:
- R2 bucket mounting as filesystem
- Persistent disk support (not near-term)

**Scaling Enhancements**:
- True stateless container scaling
- Enhanced load balancing
- Larger instance types

**Integration Features**:
- Container-to-Worker communication
- Exec functionality for debugging
- Enhanced observability tools

## 🎯 Recommendations & Mitigation Strategies

### Immediate Actions
1. **Database Strategy**: Plan for external PostgreSQL (Neon/PlanetScale)
2. **Storage Architecture**: Design R2 integration for file storage
3. **Performance Testing**: Benchmark with external dependencies
4. **Fallback Planning**: Design graceful degradation strategies

### Architecture Decisions
1. **Hybrid Approach**: Use Workers for low-latency operations, Containers for complex processing
2. **State Management**: Critical state in Durable Objects, bulk data in external systems
3. **Monitoring**: Implement comprehensive logging and alerting from day one

### Risk Mitigation
1. **Production Readiness**: Plan extended beta testing period
2. **Backup Plans**: Maintain alternative deployment strategies
3. **Performance Monitoring**: Establish baseline metrics and alerting
4. **Cost Management**: Monitor usage patterns and optimize for scale-to-zero

## 📝 Next Steps for Investigation

### High Priority Research
1. **Database Performance**: Test external database latency across regions
2. **R2 Integration**: Prototype file storage patterns
3. **Monitoring Setup**: Investigate observability tooling options
4. **Load Testing**: Validate performance under realistic load

### Medium Priority
1. **Security Audit**: Review security implications of hybrid architecture
2. **Cost Analysis**: Model pricing for production workloads
3. **Backup Strategies**: Test data export/import procedures
4. **Team Training**: Document operational procedures

This document serves as a living reference for the challenges and unknowns we face in implementing Convex backend on Cloudflare Containers. Regular updates are essential as the platform evolves and we gain more operational experience.