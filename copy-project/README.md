# `project-actions/copy-project`

[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

Copy a GitHub project

## Draft Issues

### Template Interpolation

The title and body for draft issues can include [mustache.js](https://github.com/janl/mustache.js)
templates which will be interpolated after the project is copied if the
`template-view` input is provided.

### Field Values

Field values can be set on draft issues after the project is copied by adding
an HTML comment to the body of the issue with a JSON object mapping field names
to field values.

This is most powerful when combined with template interpolation as it is
performed after the interpolation, so field values can be templated.

Example:

```html
<!-- fields
  {
    "Start Date": "2023-11-01",
    "End Date": "{{ end-date }}"
  }
-->
```

## Known Issues

There is a GitHub bug which results in a permissions error if a GitHub app auth token
is used to change the visibility on a project

## Inputs

| Name              | Description                                        | Required | Default                                      |
|-------------------|----------------------------------------------------|----------|----------------------------------------------|
| `token`           | A GitHub access token - either a classic PAT or a GitHub app installation token. | Yes      |                                              |
| `owner`           | The owner of the project - either an organization or a user. If not provided, it defaults to the repository owner. | No       | `${{ github.repository_owner }}`           |
| `project-number`  | The project number from the project's URL.         | Yes      |                                              |
| `target-owner`    | The owner of the copied project - either an organization or a user, if different from `owner`. | No       |                                              |
| `title`           | Title for the new project.                         | Yes      |                                              |
| `drafts`          | Include draft issues when copying.                 | No       | `false`                                      |
| `link-to-repository` | Repository to link the project to, in the format `owner/name`. | No       |                                              |
| `link-to-team`    | Team to link the project to, in the format `org/team`. | No       |                                              |
| `template-view`   | A `mustache` template view to be used for template interpolation on draft issues. | No       |                                              |
| `public`          | Set the project to public or private.              | No       |                                              |

## Outputs

| Name              | Description                                        |
|-------------------|----------------------------------------------------|
| `id`              | The global ID for the new project.                 |
| `closed`          | The closed state of the new project.               |
| `field-count`     | The number of fields on the new project.           |
| `item-count`      | The number of items in the new project.            |
| `number`          | The project number for the new project.            |
| `owner`           | The owner of the new project.                      |
| `public`          | The public visibility of the new project.          |
| `readme`          | The readme description of the new project.         |
| `description`     | The short description of the new project.          |
| `title`           | The title of the new project.                      |
| `url`             | The URL of the new project.                        |

## License

MIT
