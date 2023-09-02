# `project-actions/get-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Get a GitHub project

## Inputs

| Name              | Description                                        | Required | Default                                      |
|-------------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`           | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`           | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number`  | The project number from the project's URL.         | Yes      |                                              |

## Outputs

| Name              | Description                                        |
|-------------------|----------------------------------------------------|
| `id`              | The global ID for the new project.                 |
| `closed`          | The closed state of the new project.               |
| `field-count`     | The number of fields on the new project.           |
| `item-count`      | The number of items in the new project.            |
| `public`          | The public visibility of the new project.          |
| `readme`          | The readme description of the new project.         |
| `description` | The short description of the new project.              |
| `title`           | The title of the new project.                      |
| `url`             | The URL of the new project.                        |

## License

MIT
