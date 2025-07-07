# Minimal Convex backend for Cloudflare Containers
FROM ghcr.io/get-convex/convex-backend:6efab6f2b6c182b90255774d747328cfc7b80dd9

# Expose official Convex backend ports
EXPOSE 3210 3211

# Health check to verify the backend is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
CMD curl -f http://localhost:3210/ || exit 1

# The base image already has the correct entrypoint and cmd
# We're just customizing the environment for Cloudflare Workers