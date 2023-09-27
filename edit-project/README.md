# `project-actions/edit-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Edit a GitHub project

## Inputs

| Name           | Description                                                | Required | Default             |
| -------------- | ---------------------------------------------------------- | -------- | ------------------- |
| `token`       | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`       | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number` | The project number from the project's URL.         | Yes      |                                              |
| `title`       | Set the title of the project.                      | No       |                                              |
| `description` | Set the short description of the project.          | No       |                                              |
| `readme`      | Set the readme description of the project.         | No       |                                              |
| `public`      | Set the project to public or private.              | No       |                                              |

## Outputs

| Output Name   | Description                                        |
|---------------|----------------------------------------------------|
| `id`          | The global ID for the edited project.              |

## License

MIT
