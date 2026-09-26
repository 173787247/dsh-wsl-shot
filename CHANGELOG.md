# Changelog

## 0.1.1

- When the Windows clipboard has no image, return a clear structured result: `{ ok: false, error: "no image on clipboard", hint: "…" }` instead of a vague PowerShell failure.

## 0.1.0

- Initial public release of `dsh-wsl-shot` for DeepSeek Harness on Windows + WSL.
