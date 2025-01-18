# `project-actions/get-item`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Get a GitHub project item

## Known Issues

Can not get archived items due to a bug in the GitHub GraphQL API, see <https://github.com/orgs/community/discussions/42727>

## Inputs

| Name          | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `item`        | The item to get - may be the global ID for the item, the content ID, or the content URL. | No       | `${{ github.event.pull_request.html_url \|\| github.event.issue.html_url }}` |
| `field`       | Project field to get on the item.                  | No       |                                              |
| `fail-if-item-not-found` | Should the action fail if the item is not found on the project | No      | `true` |

## Outputs

| Name          | Description                                                              |
|---------------|--------------------------------------------------------------------------|
| `id`          | The global ID of the item.                                               |
| `title`       | Title of the item.                                                       |
| `body`        | Body of the item.                                                        |
| `project-id`  | The global ID of the project.                                            |
| `content-id`  | The global ID of the content - issue, pull request, or draft issue       |
| `url`         | The URL of the issue or pull request - not applicable for draft issues.  |
| `field-id`    | The global ID of the field if the field input was set.                   |
| `field-value` | The project field value for the item if the field input was set.         |

## License

MIT
