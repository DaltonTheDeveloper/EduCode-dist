# Contributing to EduCode

Thanks for your interest in contributing! EduCode is an open-source educational IDE built on VS Code.

## How to Contribute

### Reporting Issues
- Use [GitHub Issues](https://github.com/DaltonTheDeveloper/EduCode-dist/issues)
- Include your OS version and EduCode version
- Screenshots or screen recordings are helpful

### Contributing Code

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes in the relevant extension under `extensions/`
4. Test by compiling (`./build-app.sh extensions`) and running in dev mode
5. Submit a Pull Request

### Extension Development

Each extension lives in `extensions/educode-*` and is a standard VS Code extension:

```bash
cd extensions/educode-notes
npm install
npx tsc --watch  # compile on save
```

Test by running EduCode in dev mode from the VS Code source repo (see SETUP.md).

### What We're Looking For
- Bug fixes
- New sidebar tools for students (flashcards, timers, etc.)
- Better Obsidian integration
- Accessibility improvements
- Documentation

## Code of Conduct

Be kind, be constructive, be helpful. We're all here to learn.
