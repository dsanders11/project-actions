# `project-actions/edit-item`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Edit a GitHub project item

## Known Issues

Can not edit archived items due to a bug in the GitHub GraphQL API, see <https://github.com/orgs/community/discussions/42727>

## Inputs

| Name          | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `item`        | The item to edit - may be the global ID for the item, the content ID, or the content URL. | No       | `${{ github.event.pull_request.html_url \|\| github.event.issue.html_url }}` |
| `title`       | Title for the item - can only be set for draft issues. | No       |                                              |
| `body`        | Body for the item - can only be set for draft issues. | No       |                                              |
| `field`       | Project field to set on the item.                  | No       |                                              |
| `field-value` | Value to set project field to.                     | No       |                                              |

## Outputs

| Name          | Description                                        |
|---------------|----------------------------------------------------|
| `id`          | The global ID for the edited item.                 |

## License

MIT
