import { Container } from '@cloudflare/containers';

export class ConvexContainer extends Container {
    defaultPort = 3210;
    sleepAfter = "30m";

    async fetch(request: Request) {
        return await this.containerFetch(request);
    }
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) {
            const containerId = env.CONTAINER.idFromName('convex-backend');
            const containerStub = env.CONTAINER.get(containerId);
            return await containerStub.fetch(request);
        }
        
        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;