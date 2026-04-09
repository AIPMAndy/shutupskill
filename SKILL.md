---
name: shutupskill
description: 让 AI 输出更短、更直接的 OpenClaw 提示词注入工具。通过向全局 SOUL.md 追加精简规则，减少废话、鼓励先做后说、推动更紧凑的工具调用。适用于用户明确想“少废话”“更像 Claude/Opus 一样直接”“压缩输出 token”“优化 agent 输出风格”的场景。当前版本按全局 SOUL.md 工作，不提供真实的 per-agent 注入。
---

# shutupskill

向 OpenClaw 的全局 `SOUL.md` 注入一段简洁输出规则，改变整体回复风格。

## 能做什么

- 减少客套话、铺垫、犹豫表达
- 引导先做后说
- 强化工具调用前检查
- 提醒遇错重试与验证

## 不能做什么

- 不能提升模型智力
- 不能修复工具本身的精度问题
- 不能实现真正的 per-agent 隔离控制

## 工作方式

当前版本只处理全局：
- 目标文件：`/home/node/.openclaw/workspace/SOUL.md`
- 备份目录：`~/.openclaw/skills/shutupskill/backups/`

## 命令

```bash
shutup --apply
shutup --upgrade
shutup --status
shutup --diff
shutup --template-only
shutup --restore
```

默认不带参数时，等同于：

```bash
shutup --apply
```

## 输出解释

- `layout: global`：当前环境按全局 SOUL 工作
- `scope: global only`：只会影响全局，不是单独 agent
- `state: optimized`：检测到注入内容已存在

## 恢复

恢复最近一次备份：

```bash
shutup --restore
```

恢复后重启 OpenClaw 网关使配置生效。
