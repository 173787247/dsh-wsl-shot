# dsh-wsl-shot

DeepSeek Harness tool: **`win_shot`** — save a Windows clipboard image to a WSL PNG for multimodal use.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

---

## Why

Multimodal prompts need a Linux file path. This tool grabs an **image** from the Windows clipboard, saves a PNG under a jailed directory (`/tmp` or home), and returns the path + size. Clear error if the clipboard has no image.

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-shot
```

Restart `dsh web`. New session → Tools should list `win_shot`.

## Config

```yaml
- id: dsh-wsl-shot
  name: dsh-wsl-shot
  config:
    timeoutMs: 15000
    dir: /tmp/dsh-wsl-shot
```

| Key | Default | Meaning |
|-----|---------|---------|
| `timeoutMs` | `15000` | Tool timeout |
| `dir` | `/tmp/dsh-wsl-shot` | Output directory (must stay under /tmp or home) |

## Test

```sh
npm test
```

## License

MIT
