# Orchard · 果园九树

单人桌游《Orchard》网页版（React + Vite + TypeScript）。

## 模式

- **教学模式**：放置 / 果实得分 / 坏果 三步引导
- **任务模式**：随机三色目标分 + 坏果上限；达标胜利，超限或牌尽未达标失败
- **无限模式**：随机生成最多 100 张牌，打完结算

任务/无限模式的卡牌随机生成，且满足：至少 2 种颜色，同色格子四向连通。

## 开发

```bash
npm install
npm run dev
```

## 脚本

- `npm run dev` — 本地开发
- `npm run build` — 生产构建
- `npm test` — 引擎单测
