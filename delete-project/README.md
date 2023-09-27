# `project-actions/delete-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Delete a GitHub project

## Permissions

Deleting a project requires project admin permissions

## Inputs

| Name           | Description                                                | Required | Default             |
| -------------- | ---------------------------------------------------------- | -------- | ------------------- |
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |

## Outputs

This GitHub Action does not have any outputs

## License

MIT
