# `project-actions/add-item`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Add an issue or pull request to a GitHub project

## Inputs

| Name    | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `content-url` | The URL for the issue or pull request to add to the project. If not provided, it defaults to the URL of the triggering issue or pull request. | No       | `${{ github.event.pull_request.url \|\| github.event.issue.url }}` |
| `field`       | Project field to set after adding the item.        | No       |                                              |
| `field-value` | Value to set the project field to.                  | No       |                                              |

## Outputs

| Name          | Description                                        |
|---------------|----------------------------------------------------|
| `id`          | The global ID for the added item.                  |

## License

MIT
