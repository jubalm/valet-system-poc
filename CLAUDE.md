# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript application built with Vite and deployed to Cloudflare Workers. The project combines a React frontend with a Cloudflare Worker backend in a single application.

## Architecture

- **Frontend**: React 19 with TypeScript, built with Vite
- **Backend**: Cloudflare Worker (`worker/index.ts`) that handles API routes
- **Build Tool**: Vite with Cloudflare plugin for integrated development
- **Deployment**: Cloudflare Workers with static asset handling

The application follows a full-stack pattern where:
- Static assets are served from the root
- API routes (starting with `/api/`) are handled by the Worker
- Everything else falls back to the React SPA

## Key Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build both frontend and worker (`tsc -b && vite build`)
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Build and preview the production build locally
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare bindings

## Development Workflow

1. Use `npm run dev` for local development - this runs both the Vite dev server and Worker in development mode
2. The Worker serves API routes while Vite handles the frontend with HMR
3. Always run `npm run lint` before commits to ensure code quality
4. Use `npm run build` to verify production builds work correctly

## Configuration Files

- `wrangler.jsonc` - Cloudflare Worker configuration
- `vite.config.ts` - Vite configuration with Cloudflare plugin
- `tsconfig.json` - Root TypeScript config that references app, node, and worker configs
- Multiple TypeScript configs for different parts of the application:
  - `tsconfig.app.json` - Frontend application
  - `tsconfig.node.json` - Node.js build tools
  - `tsconfig.worker.json` - Cloudflare Worker

## File Structure

- `src/` - React application source code
- `worker/` - Cloudflare Worker source code
- `public/` - Static assets served by Vite
- `worker-configuration.d.ts` - TypeScript definitions for Worker environment

## API Integration

The frontend makes API calls to `/api/` routes which are handled by the Worker. The Worker returns JSON responses and uses Cloudflare's `Response.json()` helper.