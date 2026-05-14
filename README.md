# PatrolLink Frontend

PatrolLink Frontend is the web console for the smart law-enforcement headset command platform. It is built on Vue 3, TypeScript, Vite, Pinia, Vue Router, Element Plus, and the RuoYi-Vue-Plus frontend foundation.

中文说明见下方 [中文](#中文)。

## English

### Overview

This repository contains the PatrolLink command console frontend. It provides the browser-based UI for patrol monitoring, device management, dispatch operations, SOS handling, media evidence review, alerts, audit logs, and operational statistics.

The project is adapted from the RuoYi-Vue-Plus UI stack and keeps the existing authentication, permission routing, system management, dictionary, tenant, workflow, and monitoring capabilities while adding PatrolLink-specific pages under `src/views/patrol`.

### Main Features

- Patrol dashboard and operational overview
- Device, alert, SOS, dispatch, map, media, message, audit, and statistics pages
- User, role, menu, department, tenant, dictionary, notice, and system configuration management
- API encryption support aligned with the backend configuration
- SSE and WebSocket-ready client utilities
- Production build and Nginx-based Docker deployment

### Tech Stack

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- UnoCSS
- Axios

### Requirements

- Node.js `>= 20.15.0`
- npm `>= 8.19.0`
- PatrolLink Backend running on `http://localhost:8080` for local development

### Local Development

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev
```

The development server uses the port configured by `VITE_APP_PORT` in `.env.development`. The current default is `80`.

API requests using `VITE_APP_BASE_API=/dev-api` are proxied to:

```text
http://localhost:8080
```

### Build

```bash
npm run build:prod
```

The production files are generated in `dist/`.

### Docker

```bash
docker build -t patrollink-frontend .
docker run --rm -p 80:80 patrollink-frontend
```

The container builds the frontend with Node.js and serves static files through Nginx.

### Project Structure

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

### Related Repositories

- Backend: https://github.com/annual30k/PLBackend.git
- Android client: located in the parent PatrolLink workspace

## 中文

### 项目简介

PatrolLink Frontend 是智能执法耳机指挥平台的 Web 管理端。项目基于 Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus 以及 RuoYi-Vue-Plus 前端基础框架改造。

本仓库保留了原有后台管理系统的登录鉴权、权限路由、系统管理、字典、租户、工作流、监控等基础能力，并在 `src/views/patrol` 下增加 PatrolLink 业务页面，用于支撑巡防态势、设备管理、指挥调度、SOS、媒体证据、预警、审计和统计分析等场景。

### 主要功能

- 巡防工作台与运行态势总览
- 设备、预警、SOS、指挥调度、地图、媒体证据、消息、审计、统计分析页面
- 用户、角色、菜单、部门、租户、字典、通知、系统参数等后台管理能力
- 与后端配置一致的接口加密支持
- SSE 与 WebSocket 客户端工具预留
- 生产构建与 Nginx Docker 部署

### 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- UnoCSS
- Axios

### 环境要求

- Node.js `>= 20.15.0`
- npm `>= 8.19.0`
- 本地开发时需要 PatrolLink 后端运行在 `http://localhost:8080`

### 本地开发

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev
```

开发服务端口由 `.env.development` 中的 `VITE_APP_PORT` 控制，当前默认值为 `80`。

当前开发环境接口前缀为 `VITE_APP_BASE_API=/dev-api`，会代理到：

```text
http://localhost:8080
```

### 构建

```bash
npm run build:prod
```

构建产物输出到 `dist/`。

### Docker 部署

```bash
docker build -t patrollink-frontend .
docker run --rm -p 80:80 patrollink-frontend
```

镜像会先使用 Node.js 构建前端，再通过 Nginx 提供静态文件服务。

### 目录结构

```text
src/api             接口请求封装
src/assets          静态资源与全局样式
src/components      通用 Vue 组件
src/layout          后台管理布局
src/router          路由配置
src/store           Pinia 状态管理
src/utils           通用工具
src/views/patrol    PatrolLink 业务页面
vite                Vite 插件配置
docker              容器部署用 Nginx 配置
```

### 相关仓库

- 后端仓库：https://github.com/annual30k/PLBackend.git
- Android 客户端：位于 PatrolLink 父级工作区

### 框架来源

本项目基于 RuoYi-Vue-Plus 前端框架改造。来源信息记录在 `PATROLLINK_SOURCE.md`。
