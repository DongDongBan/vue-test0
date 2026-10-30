# 任务看板 · Task Board

一个用 **Vue 3 + Vite** 实现的单页任务看板：三列流转、拖拽排序、搜索筛选、本地持久化，并带完整的键盘操作。

项目遵守一条硬约束：**不新增任何 npm 依赖**（没有 vue-router、没有 Pinia、没有 UI 库、没有测试框架），所有能力用 Vue 自身 + 浏览器原生 API 实现。

## 功能

- 三列看板：待办 / 进行中 / 已完成；列内顺序即数据数组顺序
- 新建、编辑、删除（二次确认）、Toast 反馈
- 拖拽跨列移动与列内排序，带落点指示线
- 键盘全流程：`Tab` / `Enter` / `Delete` / `Ctrl(⌘)` + 方向键 / `N` / `Esc`
- 搜索（标题、描述、标签、负责人）与筛选（优先级多选、截止状态）
- 统计：总任务数、完成率、逾期数，计数随筛选联动
- `localStorage` 持久化：带版本号、损坏数据兜底、配额失败提示
- 响应式三档断点，跟随系统深色模式

## 快速开始

```bash
npm install
npm run dev
```

打开终端提示的地址（默认 `http://localhost:5173`）。

```bash
npm run build     # 生产构建，输出到 dist/
npm run preview   # 本地预览构建产物
```

运行环境：Node.js ≥ 22.18（见 `package.json` 的 `engines`）。

## 快捷键

| 按键 | 作用 |
| --- | --- |
| `Tab` | 在任务卡片与控件间移动焦点 |
| `Enter` | 卡片聚焦时打开编辑 |
| `Delete` | 卡片聚焦时删除（需确认） |
| `Ctrl/⌘ + ←/→` | 卡片移到相邻列 |
| `Ctrl/⌘ + ↑/↓` | 列内调整顺序 |
| `N` | 新建任务（焦点不在输入框时） |
| `Esc` | 关闭弹窗 / 确认框 |

卡片右下角的“移动到”下拉是触屏与筛选状态下的等价移动方式。

## 目录结构

```
src/
├── main.js                 # 应用入口：挂载 App
├── App.vue                 # 页面编排：状态、弹窗、Toast、快捷键
├── styles/
│   ├── tokens.css          # 设计令牌（颜色/间距/圆角/阴影/字体）
│   ├── global.css          # 全局重置与可访问性工具类
│   └── app.css             # App 的 scoped 样式
├── domain/                 # 纯 JS 业务逻辑，不 import vue
│   ├── task.js             # 模型、常量、校验、id、日期
│   ├── board.js            # 增删改、移动、重排
│   ├── filter.js           # 搜索与筛选
│   ├── stats.js            # 统计
│   └── storage.js          # 序列化、版本校验、容错
├── composables/            # 响应式装配
│   ├── useBoard.js         # 唯一状态源 + 自动保存
│   ├── useDragDrop.js      # 拖拽状态 + 槽位换算
│   ├── useColumnDrag.js    # 单列拖拽事件
│   ├── useKeyboardMove.js  # 键盘移动 + 焦点恢复
│   └── useToast.js         # Toast 队列
└── components/
    ├── BoardColumn.vue     # 列：标题、计数、卡片列表、空状态
    ├── TaskCard.vue        # 卡片：优先级、标签、截止、操作
    ├── BoardToolbar.vue    # 搜索与筛选
    ├── TaskFormDialog.vue  # 新建/编辑弹窗
    ├── ConfirmDialog.vue   # 删除确认
    └── ToastHost.vue       # 提示容器（aria-live）
```

依赖方向单向向下：`components → composables → domain`。

## 设计约束

- **无路由**：单视图，弹窗用条件渲染
- **无状态库**：`useBoard()` 是唯一状态源，只在 `App.vue` 调用一次
- **无 UI 库**：手写 CSS + 设计令牌，内置 SVG 图标
- **无拖拽库**：HTML5 Drag and Drop + 键盘/下拉作为等价路径
- **无测试框架**：质量由人工验收（见验收清单）+ 构建检查保证

## 文档

- [需求规格说明书](docs/需求规格说明书.md) —— 功能/非功能需求、数据模型、交互规格、架构决策
- [教学文档](docs/教学文档.md) —— 面向 Vue 3 新手，按实现顺序讲解每个知识点
- [验收清单](docs/验收清单.md) —— 上线前逐项手工验证

## 数据存储

- 存储键：`vue-kanban:board`
- 格式：`{ "schemaVersion": 1, "tasks": [...] }`
- 读取时逐字段校验；损坏则回退为空看板并提示
- 隐私模式或配额满时降级为内存存储，并提示“本次修改不会被保存”

清空数据：在浏览器控制台执行 `localStorage.removeItem('vue-kanban:board')` 后刷新。

## 已知限制

- 筛选状态下禁用拖拽（可见列表顺序与真实数组不一致，按下标换算会错位）；此时可用“移动到”下拉或键盘。
- 移动端浏览器基本不支持 HTML5 拖拽，请使用“移动到”下拉。
- 同一浏览器的多个标签页之间不会实时同步。
- 没有删除撤销、没有回收站。
- 不支持多人协作（纯本地单用户）。
