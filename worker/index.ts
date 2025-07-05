import { DurableObject } from 'cloudflare:workers';

export class Container extends DurableObject<Env> {
    container?: globalThis.Container;
    monitor?: Promise<unknown>;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        // Container will be available when Cloudflare Containers beta is enabled
        this.container = ctx.container;
        if (this.container) {
            void this.ctx.blockConcurrencyWhile(async () => {
                if (!this.container!.running) this.container!.start();
            });
        }
    }

    async fetch(req: Request) {
        try {
            // Forward to the actual Convex backend container
            if (this.container) {
                try {
                    return await this.container.getTcpPort(3210).fetch(req.url.replace('https:', 'http:'), req);
                } catch (containerErr) {
                    // If container fails, provide detailed error info
                    const url = new URL(req.url);
                    return Response.json({
                        message: "Container available but failed to respond",
                        error: containerErr instanceof Error ? containerErr.message : String(containerErr),
                        durableObjectId: this.ctx.id.toString(),
                        path: url.pathname,
                        method: req.method,
                        containerStatus: "available_but_failed"
                    }, { status: 502 });
                }
            }
            
            // Fallback if container is not available
            const url = new URL(req.url);
            return Response.json({
                message: "HTTP passthrough infrastructure ready",
                durableObjectId: this.ctx.id.toString(),
                path: url.pathname,
                method: req.method,
                containerStatus: "not_available",
                note: "Container context not provided - this is expected in Cloudflare Containers beta"
            });
        } catch (err) {
            return new Response(`${this.ctx.id.toString()}: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
        }
    }
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) {
            try {
                return await env.CONTAINER.get(env.CONTAINER.idFromName('convex-backend')).fetch(request);
            } catch (err) {
                console.error('Error forwarding to Convex backend:', err instanceof Error ? err.message : String(err));
                return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
            }
        }
        
        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
