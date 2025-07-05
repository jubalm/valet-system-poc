# Custom Convex backend image for Cloudflare Containers
FROM ghcr.io/get-convex/convex-backend:6efab6f2b6c182b90255774d747328cfc7b80dd9

# Create necessary directories for Convex data persistence
RUN mkdir -p /convex/data /convex/data/tmp

# Set environment variables based on local testing findings
ENV DO_NOT_REQUIRE_SSL=true
ENV RUST_LOG=info
ENV INSTANCE_NAME=cloudflare-container
ENV CONVEX_CLOUD_ORIGIN=http://0.0.0.0:3210
ENV CONVEX_SITE_ORIGIN=http://0.0.0.0:3211
ENV DISABLE_BEACON=true

# Ensure data directory has proper permissions
RUN chmod -R 755 /convex/data

# Set working directory
WORKDIR /convex

# Expose the default Convex ports
EXPOSE 3210 3211

# Health check to verify the backend is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3210/ || exit 1

# The base image already has the correct entrypoint and cmd
# We're just customizing the environment for Cloudflare Workers