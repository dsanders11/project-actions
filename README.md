# GitHub Project Actions

[![CI](https://github.com/dsanders11/project-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/dsanders11/project-actions/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/dsanders11/project-actions?color=blue)](https://github.com/dsanders11/project-actions/releases)

A collection of actions for automating GitHub projects

## Authentication

For organization projects, the recommended way to use these actions is with a
GitHub app. An authentication token for the app can be easily generated in the
GitHub actions workflow using `electron/github-app-auth-action`. For public
repositories the app does not need to be installed on the repository itself,
only the organization. For private repositories the app must be installed on
the repository and given proper permissions to view issues and pull requests.

For user projects, the recommended way to use these actions is with a classic
PAT (Personal Access Token). The PAT must have the `project` scope, and for
private repositories the PAT must also have the `repo` scope.

## Actions

| Action                                             | Description                                    |
|----------------------------------------------------|------------------------------------------------|
| [`project-actions/add-item`](add-item)             | Add an item (issue or pull request) to project |
| [`project-actions/archive-item`](archive-item)     | Archive an item on a project                   |
| [`project-actions/close-project`](close-project)   | Close a project                                |
| [`project-actions/completed-by`](completed-by)     | Change item field value when PRs are merged    |
| [`project-actions/copy-project`](copy-project)     | Copy a project                                 |
| [`project-actions/delete-item`](delete-item)       | Delete an item on a project                    |
| [`project-actions/delete-project`](delete-project) | Delete a project                               |
| [`project-actions/edit-item`](edit-item)           | Edit an item on a project                      |
| [`project-actions/edit-project`](edit-project)     | Edit a project                                 |
| [`project-actions/get-item`](get-item)             | Get an item on a project                       |
| [`project-actions/get-project`](get-project)       | Get a project                                  |
| [`project-actions/github-script`](github-script)   | Modify projects programmatically               |
| [`project-actions/link-project`](link-project)     | Link a project to a repository                 |

## License

MIT
