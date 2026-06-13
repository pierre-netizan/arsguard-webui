# arsguard-webui

arsguard-webui 是 [harden-openclaw](https://github.com/pierre-netizan/harden-openclaw) 安全加固方案的 Web 管理界面，基于 Next.js 构建，提供可视化仪表盘、实时监控和配置管理能力，帮助运维人员直观掌握 LLM 网关的安全运行状态。

## 功能特性

- **安全仪表盘**：实时展示 arsguard 各检测钩子的拦截统计、请求分布和趋势图表，支持按时间维度筛选查看
- **日志查询**：基于 hardened 代理的请求/响应日志检索，支持全文搜索和条件过滤，快速定位安全事件
- **规则管理**：在线查看和调整 arsguard 的 OWASP Top 10 for AI Agents 检测规则，支持按严重级别和类别分类管理
- **系统监控**：展示 OpenClaw 网关的运行状态、吞吐量、延迟分布等关键指标，辅助容量规划与性能调优
- **配置管理**：支持通过 Web 界面修改 arsguard 参数阈值、启用/禁用特定检测钩子，配置变更实时生效

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 12 (React) |
| 样式 | Tailwind CSS |
| 语言 | TypeScript |
| API 代理 | Next.js API Routes — 透明转发至 arsguard / hardened / native 后端 |

## 项目结构

```
webui/
├── components/          # 通用 UI 组件
│   ├── ChatPanel.tsx    # 聊天/日志面板组件
├── pages/
│   ├── _app.tsx         # Next.js 应用入口
│   ├── index.tsx        # 首页仪表盘
│   └── api/
│       ├── arsguard/check.ts       # arsguard 安全检测接口
│       ├── hardened/[[...path]].ts  # hardened 代理转发
│       └── native/[[...path]].ts    # 原生 OpenClaw 转发
├── public/              # 静态资源
├── styles/              # 全局样式
│   └── globals.css
├── next.config.js       # Next.js 配置
├── tailwind.config.js   # Tailwind 主题配置
└── tsconfig.json        # TypeScript 配置
```

## 开发

```bash
# 克隆主仓库（包含子模块）
git clone --recurse-submodules git@github.com:pierre-netizan/harden-openclaw.git
cd harden-openclaw/webui

# 安装依赖
npm install

# 启动开发服务器（默认端口 3000）
npm run dev
```

确保后端服务（arsguard、OpenClaw）已在目标地址运行，API 路由会通过 Next.js 的 Server-Side Proxy 进行透明转发。

## 部署

生产环境推荐使用 `npm run build && npm start`，或通过 Docker 容器化部署。

```bash
npm run build
npm start
```
