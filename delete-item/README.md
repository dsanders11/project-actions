# `project-actions/delete-item`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Delete a GitHub project item

## Known Issues

Can not delete archived items due to a bug in the GitHub GraphQL API, see <https://github.com/orgs/community/discussions/42727>

## Inputs

| Name          | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `item`        | The item to delete - may be the global ID for the item, the content ID, or the content URL. | No       | `${{ github.event.pull_request.html_url \|\| github.event.issue.html_url }}` |
| `fail-if-item-not-found` | Should the action fail if the item is not found on the project | No      | `true` |

## Outputs

This GitHub Action does not have any outputs

## License

MIT
