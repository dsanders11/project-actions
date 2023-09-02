# `project-actions/github-script`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

This action is a fork of [`actions/github-script`](https://github.com/actions/github-script)
which adds an `action` value which exposes the functions in `src/lib.ts` for
programmatic usage (`getItem`, `deleteProject`, etc). See that repository
for more information about the action - the only major difference is the
`github-token` input has been renamed to `token` for consistency.

> [!WARNING]
> This action is largely untested and considered experimental. The functions in
> `src/lib.ts` were not originally intended as a public API, are not
> well-documented, and are subject to change outside of normal semver.

## License

MIT
