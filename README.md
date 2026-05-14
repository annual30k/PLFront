# PatrolLink Frontend

[中文文档](README.zh-CN.md)

PatrolLink Frontend is the web console for the smart law-enforcement headset command platform. It is built on Vue 3, TypeScript, Vite, Pinia, Vue Router, Element Plus, and the RuoYi-Vue-Plus frontend foundation.

## Overview

This repository contains the PatrolLink command console frontend. It provides the browser-based UI for patrol monitoring, device management, dispatch operations, SOS handling, media evidence review, alerts, audit logs, and operational statistics.

The project is adapted from the RuoYi-Vue-Plus UI stack and keeps the existing authentication, permission routing, system management, dictionary, tenant, workflow, and monitoring capabilities while adding PatrolLink-specific pages under `src/views/patrol`.

## Main Features

- Patrol dashboard and operational overview
- Device, alert, SOS, dispatch, map, media, message, audit, and statistics pages
- User, role, menu, department, tenant, dictionary, notice, and system configuration management
- API encryption support aligned with the backend configuration
- SSE and WebSocket-ready client utilities
- Production build and Nginx-based Docker deployment

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- UnoCSS
- Axios

## Requirements

- Node.js `>= 20.15.0`
- npm `>= 8.19.0`
- PatrolLink Backend running on `http://localhost:8080` for local development

## Local Development

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev
```

The development server uses the port configured by `VITE_APP_PORT` in `.env.development`. The current default is `80`.

API requests using `VITE_APP_BASE_API=/dev-api` are proxied to:

```text
http://localhost:8080
```

## Build

```bash
npm run build:prod
```

The production files are generated in `dist/`.

## Docker

```bash
docker build -t patrollink-frontend .
docker run --rm -p 80:80 patrollink-frontend
```

The container builds the frontend with Node.js and serves static files through Nginx.

## Project Structure

```text
src/api             API clients
src/assets          Static assets and global styles
src/components      Shared Vue components
src/layout          Admin console layout
src/router          Route configuration
src/store           Pinia stores
src/utils           Shared utilities
src/views/patrol    PatrolLink business pages
vite                Vite plugin configuration
docker              Nginx configuration for container deployment
```

## Related Repositories

- Backend: https://github.com/annual30k/PLBackend.git
- Android client: located in the parent PatrolLink workspace

## Framework Source

This project is adapted from the RuoYi-Vue-Plus frontend framework. Source details are recorded in `PATROLLINK_SOURCE.md`.
