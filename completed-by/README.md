# `project-actions/completed-by`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Change a project field on draft issues when linked pull requests are merged.

This action iterates all draft issues on a project looking for any which have
lines that follow the format (should be on a line by itself)
"Completed by https://github.com/dsanders11/project-actions/pull/2". There can
be multiple such lines. Each linked pull request will be checked, and if they
are all merged, the `field` input will be updated to `field-value`. For
convenience `field` defaults to the standard "Status" field.

## Inputs

| Name           | Description                                                | Required | Default             |
| -------------- | ---------------------------------------------------------- | -------- | ------------------- |
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `field`       | Project field to set once completed.        | Yes       | `Status`                                             |
| `field-value` | Value to set the project field to.                  | Yes       |                                              |

## Outputs

There are no outputs for this action

## License

MIT
