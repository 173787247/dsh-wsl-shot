# dsh-wsl-shot

DeepSeek Harness 工具：**`win_shot`** — 将 Windows 剪贴板图片保存为 WSL PNG，供多模态使用。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

---

## 为什么需要

多模态输入需要 Linux 文件路径。本工具从 Windows 剪贴板取 **图片**，保存为 PNG 到受限目录（`/tmp` 或 home），返回路径与大小；若无图片则明确报错。

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-shot
```

重启 `dsh web`。新会话 → Tools 应出现 `win_shot`。

## 配置

```yaml
- id: dsh-wsl-shot
  name: dsh-wsl-shot
  config:
    timeoutMs: 15000
    dir: /tmp/dsh-wsl-shot
```

| 键 | 默认 | 含义 |
|----|------|------|
| `timeoutMs` | `15000` | 工具超时 |
| `dir` | `/tmp/dsh-wsl-shot` | 输出目录（必须在 /tmp 或 home 下） |

## 测试

```sh
npm test
```

## 许可

MIT
