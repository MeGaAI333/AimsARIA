# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

AimsARIA ("Automated REVENUE Intelligence Agent") is a brand-new, empty repository. At present it contains only a `README.md` with the project name and tagline — there is no source code, dependency manifest, build system, test suite, or CI configuration yet.

Because there is no established codebase, do not assume any particular language, framework, or directory layout. When the user starts adding code, update this file to document:

- The actual build/lint/test commands once a package manager or build tool is introduced (e.g. `package.json`, `pyproject.toml`, `Cargo.toml`, etc.)
- The real architecture once there are multiple modules/files whose relationships aren't obvious from the file listing alone
- Any conventions established by the user, rather than ones inferred from generic best practices

Until then, treat this as a greenfield project: confirm the intended stack and structure with the user before scaffolding anything non-trivial.
