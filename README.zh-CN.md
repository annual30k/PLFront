# PatrolLink 前端

[English](README.md)

PatrolLink Frontend 是智能执法耳机指挥平台的 Web 管理端。项目基于 Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus 以及 RuoYi-Vue-Plus 前端基础框架改造。

## 项目简介

本仓库提供 PatrolLink 指挥后台的前端界面，用于支撑巡防态势、设备管理、指挥调度、SOS、媒体证据、预警、审计和统计分析等场景。

本仓库保留了原有后台管理系统的登录鉴权、权限路由、系统管理、字典、租户、工作流、监控等基础能力，并在 `src/views/patrol` 下增加 PatrolLink 业务页面。

## 主要功能

- 巡防工作台与运行态势总览
- 设备、预警、SOS、指挥调度、地图、媒体证据、消息、审计、统计分析页面
- 用户、角色、菜单、部门、租户、字典、通知、系统参数等后台管理能力
- 与后端配置一致的接口加密支持
- SSE 与 WebSocket 客户端工具预留
- 生产构建与 Nginx Docker 部署

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- UnoCSS
- Axios

## 环境要求

- Node.js `>= 20.15.0`
- npm `>= 8.19.0`
- 本地开发时需要 PatrolLink 后端运行在 `http://localhost:8080`

## 本地开发

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev
```

开发服务端口由 `.env.development` 中的 `VITE_APP_PORT` 控制，当前默认值为 `80`。

当前开发环境接口前缀为 `VITE_APP_BASE_API=/dev-api`，会代理到：

```text
http://localhost:8080
```

## 构建

```bash
npm run build:prod
```

构建产物输出到 `dist/`。

## Docker 部署

```bash
docker build -t patrollink-frontend .
docker run --rm -p 80:80 patrollink-frontend
```

镜像会先使用 Node.js 构建前端，再通过 Nginx 提供静态文件服务。

## 目录结构

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

## 相关仓库

- 后端仓库：https://github.com/annual30k/PLBackend.git
- Android 客户端：位于 PatrolLink 父级工作区

## 框架来源

本项目基于 RuoYi-Vue-Plus 前端框架改造。来源信息记录在 `PATROLLINK_SOURCE.md`。
