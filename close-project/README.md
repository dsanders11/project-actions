# `project-actions/close-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Close or reopen a GitHub project

## Permissions

Closing a project requires project admin permissions

## Inputs

| Name           | Description                                                | Required | Default             |
| -------------- | ---------------------------------------------------------- | -------- | ------------------- |
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `closed`       | Closed state of the project - set to `false` to reopen a closed project. | No       | `true`              |

## Outputs

| Output Name   | Description                                        |
|---------------|----------------------------------------------------|
| `id`          | The global ID for the closed project.              |

## License

MIT
