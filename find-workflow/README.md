# `project-actions/find-workflow`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Find a GitHub project workflow

## Known Issues

Only enabled workflows are visible via the GitHub GraphQL API.

## Inputs

| Name          | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `name`           | The name of the project workflow to find.          | Yes      |                                              |
| `fail-if-workflow-not-found` | Should the action fail if the workflow is not found on the project | No      | `true` |

## Outputs

| Name          | Description                                                              |
|---------------|--------------------------------------------------------------------------|
| `id`          | The global ID of the workflow.                                           |
| `name `       | Name of the workflow.                                                    |
| `number`      | Number of the workflow.                                                  |
| `enabled`     | The enabled state of the workflow.                                       |
| `project-id`  | The global ID of the project.                                            |

## License

MIT
