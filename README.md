# shutupskill

让 AI 不废话。不是魔法，是提示词注入。

## 现在解决了什么

原项目最大问题，不是理念，而是实现假设过时：

- 旧版写死 `~/.openclaw/agents/<agent>/workspace/SOUL.md`
- 但当前 OpenClaw 环境通常只有全局 `SOUL.md`
- 结果：`--agent`、`--all`、状态判断都会误导

新版直接收敛：

- 只支持 **全局 SOUL 注入**
- 不再伪装成 per-agent 优化
- 状态输出明确写 `scope: global only`
- 自动备份，可恢复

## 功能

- 压缩输出风格
- 引导先做后说
- 提醒并行工具调用
- 强化错误重试与结果验证

## 用法

```bash
shutup --apply
shutup --upgrade
shutup --status
shutup --diff
shutup --template-only
shutup --restore
```

默认：

```bash
shutup
```

等同于：

```bash
shutup --apply
```

## 状态示例

```bash
shutupskill status

layout: global
soul:   /home/node/.openclaw/workspace/SOUL.md
agents: main, battlewrite-writer, battlewrite-critic, battlewrite-judge
state:  optimized (v1.1.0)
scope:  global only
```

## 适合场景

- GPT / Kimi 这类偏啰嗦模型
- 编程、排错、数据分析、文档处理
- 想减少无效 token

## 不适合场景

- 需要详细解释的教学场景
- 创意写作
- 情感交流
- 需要真正 per-agent 独立 persona 的部署

## 恢复

```bash
shutup --restore
```

## 结论

这版不吹。只做一件事：

**把全局 SOUL 改得更短、更狠、更像任务型 agent。**
