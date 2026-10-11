# figma-flow

A Claude Code plugin for turning Figma frames into React that matches them.

- **Skill** (`skills/figma-flow`): read the design, stop on gaps, export Figma's values, build,
  have a fresh agent look at screenshots, then measure exact values. Look finds problems;
  measurement decides when it is done.
- **Agent** (`agents/looker.md`): the fresh pair of eyes. Read-only, told nothing about how
  the implementation was built.
- **Mod** (`hooks/register.ts`): saves a marked `use_figma` result straight to a file, and
  holds `git commit` and `git push` after design edits until a command containing
  `test:figma` passes. `/figma-flow` shows what is held; `/figma-flow release` lifts it.

## Try it

```sh
claude --plugin-dir plugins/figma-flow
```

Mods need Claude Code 2.1.287 or later, and run with your permissions, unsandboxed. In a cloud
session or the VS Code panel the hooks run but nothing is drawn.

## Check it

```sh
claude plugin validate plugins/figma-flow
claude plugin test plugins/figma-flow
```
