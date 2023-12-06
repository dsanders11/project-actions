# `project-actions/link-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Link a GitHub project to a repository or team

## Permissions

When using a classic PAT, `repo` scope is needed for linking a repository
and `admin:org` is needed for linking a team. With a GitHub app auth token
the app must have the "Contents" (read and write) permission for linking
a repository, and the "Members" (read-only or above) permission for
linking a team.

Admin permissions for projects is also required.

## Inputs

| Name          | Description                                        | Required | Default                                      |
|---------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `repository`  | Repository to link the project to, in the format `owner/name`. | No       |                                              |
| `team`        | Team to link the project to, in the format `org/team`. | No       |                                              |
| `linked`      | Linked state of the project - set to false to unlink an existing link. | No       | `true`                                       |

## Outputs

| Name          | Description                                             |
|---------------|---------------------------------------------------------|
| `project-id`  | The global ID for the linked project.                   |
| `repository-id` | The global ID for the repository if one was provided. |
| `team-id`     | The global ID for the team if one was provided.         |

## License

MIT
