import { GraphqlResponseError } from '@octokit/graphql';
import type { PageInfoForward } from '@octokit/plugin-paginate-graphql';

import { getOctokit, execCliCommand } from './helpers.js';

const PROJECT_ITEM_CONTENT_FRAGMENT = `
  content {
    ... on DraftIssue {
      id
      body
      title
    }
    ... on Issue {
      id
      url
      body
      title
    }
    ... on PullRequest {
      id
      url
      body
      title
    }
  }
  id
  type`;

const PROJECT_ITEMS_QUERY = `
  query paginate($cursor: String, $projectId: ID!) {
    projectV2: node(id: $projectId) {
      ... on ProjectV2 {
        id
        items(first: 50, after: $cursor) {
          nodes {
            ${PROJECT_ITEM_CONTENT_FRAGMENT}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }`;

const PROJECT_WORKFLOW_FRAGMENT = `
  ... on ProjectV2Workflow {
    id
    name
    number
    enabled
  }`;

const PROJECT_WORKFLOWS_QUERY = `
  query paginate($cursor: String, $projectId: ID!) {
    projectV2: node(id: $projectId) {
      ... on ProjectV2 {
        id
        workflows(first: 50, after: $cursor) {
          nodes {
            ${PROJECT_WORKFLOW_FRAGMENT}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }`;

interface ItemField {
  id: string;
  value: string | number | null;
}

export type ItemDetails = {
  id: string;
  projectId: string;
} & (
  | { content: DraftIssueItemContent; field?: ItemField; type: 'DRAFT_ISSUE' }
  | {
      content: ProjectItemContent;
      field?: ItemField;
      type: 'ISSUE' | 'PULL_REQUEST';
    }
  | { content: null; type: 'REDACTED' }
);

export interface ProjectDetails {
  number: number;
  url: string;
  shortDescription: string;
  title: string;
  readme: string;
  public: boolean;
  closed: boolean;
  id: string;
  items: {
    totalCount: number;
  };
  fields: {
    totalCount: number;
  };
  owner: {
    type: 'Organization' | 'User';
    login: string;
  };
}

export interface WorkflowDetails {
  id: string;
  name: string;
  number: number;
  enabled: boolean;
  projectId: string;
}

export interface ItemEdit {
  title?: string;
  body?: string;
  field?: string;
  fieldValue?: string;
}

export interface ProjectEdit {
  description?: string;
  title?: string;
  readme?: string;
  public?: boolean;
}

export class FieldNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Field not found', { cause });
  }
}
export class ItemNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Item not found', { cause });
  }
}
export class ProjectNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Project not found', { cause });
  }
}
export class RepositoryNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Repository not found', { cause });
  }
}
export class SingleSelectOptionNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Option not found', { cause });
  }
}
export class TeamNotFoundError extends Error {
  constructor(cause?: Error) {
    super('Team not found', { cause });
  }
}

export type ProjectItemContent = {
  id: string;
  url: string;
  body: string;
  title: string;
};

type DraftIssueItemContent = Omit<ProjectItemContent, 'url'>;

export type ProjectItem =
  | {
      id: string;
      content: ProjectItemContent;
      type: 'ISSUE' | 'PULL_REQUEST';
    }
  | DraftIssueItem
  | { id: string; content: null; type: 'REDACTED' };

export type ProjectItemWithFieldValue = ProjectItem & {
  fieldValueByName: {
    date?: string;
    text?: string;
    number?: number;
    singleSelectValue?: string;
  } | null;
};

export type DraftIssueItem = {
  id: string;
  content: DraftIssueItemContent;
  type: 'DRAFT_ISSUE';
};

export type FieldTypeResponse = {
  projectV2Item: {
    project?: {
      field: {
        id: string;
        dataType: 'DATE' | 'NUMBER' | 'SINGLE_SELECT' | 'TEXT';
      } | null;
    };
  };
};

export type ProjectItemsWithFieldResponse = {
  projectV2: {
    field: {
      id: string;
    } | null;
    items: {
      nodes: ProjectItemWithFieldValue[];
      pageInfo: PageInfoForward;
    };
  };
};

export type ProjectItemsResponse = {
  projectV2: {
    items: {
      nodes: ProjectItem[];
      pageInfo: PageInfoForward;
    };
  };
};

export type ProjectWorkflow = {
  id: string;
  name: string;
  number: number;
  enabled: boolean;
};

export type ProjectWorkflowResponse = {
  projectV2: {
    workflow: ProjectWorkflow;
  };
};

export type ProjectWorkflowsResponse = {
  projectV2: {
    workflows: {
      nodes: ProjectWorkflow[];
      pageInfo: PageInfoForward;
    };
  };
};

export type RepositoryIdResponse = {
  repository: {
    id: string;
  };
};

export type TeamIdResponse = {
  organization: {
    team: {
      id: string | null;
    } | null;
  };
};

export type SingleSelectOptionIdResponse = {
  projectV2: {
    field: {
      options: {
        id: string;
      }[];
    };
  };
};

function isDraftIssue(item: ProjectItem): item is DraftIssueItem {
  return item.type === 'DRAFT_ISSUE';
}

export function handleCliError(error: unknown): never {
  if (
    error instanceof Error &&
    error.message.includes('Could not resolve to a ProjectV2')
  ) {
    throw new ProjectNotFoundError(error);
  } else if (
    error instanceof Error &&
    error.message.includes('Could not resolve to a Repository')
  ) {
    throw new RepositoryNotFoundError(error);
  } else {
    throw error;
  }
}

/**
 * @throws FieldNotFoundError
 * @throws ProjectNotFoundError
 */
export async function getItem(
  owner: string,
  projectNumber: string,
  item: string,
  field?: string
): Promise<ItemDetails | null> {
  const octokit = getOctokit();
  let pageIterator:
    | ReturnType<typeof octokit.graphql.paginate.iterator<ProjectItemsResponse>>
    | ReturnType<
        typeof octokit.graphql.paginate.iterator<ProjectItemsWithFieldResponse>
      >;

  const project = await getProject(owner, projectNumber);

  if (field !== undefined) {
    pageIterator =
      octokit.graphql.paginate.iterator<ProjectItemsWithFieldResponse>(
        `query paginate($cursor: String, $projectId: ID!, $field: String!) {
          projectV2: node(id: $projectId) {
            ... on ProjectV2 {
              id
              field(name: $field) {
                ... on ProjectV2FieldCommon {
                  id
                }
              }
              items(first: 50, after: $cursor) {
                nodes {
                  fieldValueByName(name: $field) {
                    ... on ProjectV2ItemFieldDateValue {
                      date
                    }
                    ... on ProjectV2ItemFieldTextValue {
                      text
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      number
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      singleSelectValue: name
                    }
                  }
                  ${PROJECT_ITEM_CONTENT_FRAGMENT}
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }`,
        {
          projectId: project.id,
          field
        }
      );
  } else {
    pageIterator = octokit.graphql.paginate.iterator<ProjectItemsResponse>(
      PROJECT_ITEMS_QUERY,
      { projectId: project.id }
    );
  }

  try {
    for await (const { projectV2 } of pageIterator) {
      for (const node of projectV2.items.nodes) {
        if (
          node.id === item ||
          node.content?.id === item ||
          (node.type !== 'DRAFT_ISSUE' &&
            node.type !== 'REDACTED' &&
            node.content.url === item)
        ) {
          const details = {
            id: node.id,
            projectId: project.id,
            content: node.content,
            type: node.type
          } as ItemDetails;

          if (
            details.type !== 'REDACTED' &&
            'field' in projectV2 &&
            'fieldValueByName' in node
          ) {
            if (projectV2.field === null) {
              throw new FieldNotFoundError();
            }

            if (node.fieldValueByName !== null) {
              const { date, number, text, singleSelectValue } =
                node.fieldValueByName;

              details.field = {
                id: projectV2.field.id,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                value: (date ?? number ?? text ?? singleSelectValue)!
              };
            } else {
              details.field = {
                id: projectV2.field.id,
                value: null
              };
            }
          }

          return details;
        }
      }
    }
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        const { path } = error.errors[0];
        if (path.length === 1) {
          throw new ProjectNotFoundError(error);
        } else if (path.length === 2 && path.at(1) === 'field') {
          throw new FieldNotFoundError(error);
        }
      }
    }

    throw error;
  }

  return null;
}

/**
 * @throws ProjectNotFoundError
 */
export async function getAllItems(projectId: string): Promise<ProjectItem[]> {
  const octokit = getOctokit();

  const pageIterator = octokit.graphql.paginate.iterator<ProjectItemsResponse>(
    PROJECT_ITEMS_QUERY,
    { projectId }
  );

  const items: ProjectItem[] = [];

  try {
    for await (const { projectV2 } of pageIterator) {
      for (const node of projectV2.items.nodes) {
        if (node.type === 'REDACTED' || Object.keys(node.content).length) {
          items.push(node);
        }
      }
    }
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        throw new ProjectNotFoundError(error);
      }
    }

    throw error;
  }

  return items;
}

/**
 * @throws ProjectNotFoundError
 */
export async function getDraftIssues(
  projectId: string
): Promise<DraftIssueItem[]> {
  const items = await getAllItems(projectId);

  return items.filter(isDraftIssue);
}

/**
 * @throws ProjectNotFoundError
 */
export async function getWorkflow(
  owner: string,
  projectNumber: string,
  number: number
): Promise<WorkflowDetails | null> {
  const octokit = getOctokit();

  const { id: projectId } = await getProject(owner, projectNumber);

  try {
    const { projectV2: project } =
      await octokit.graphql<ProjectWorkflowResponse>(
        `query ($projectId: ID!, $number: Int!) {
            projectV2: node(id: $projectId) {
              ... on ProjectV2 {
                workflow(number: $number) {
                  ${PROJECT_WORKFLOW_FRAGMENT}
                }
              }
            }
          }`,
        { projectId, number }
      );

    if (project.workflow) {
      return {
        id: project.workflow.id,
        name: project.workflow.name,
        number: project.workflow.number,
        enabled: project.workflow.enabled,
        projectId
      };
    }
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        throw new ProjectNotFoundError(error);
      }
    }

    throw error;
  }

  return null;
}

export async function addItem(
  owner: string,
  projectNumber: string,
  url: string
): Promise<string> {
  let output: string;

  try {
    output = await execCliCommand([
      'project',
      'item-add',
      projectNumber,
      '--owner',
      owner,
      '--url',
      url,
      '--format',
      'json'
    ]);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(output).id;
}

/**
 * @throws ProjectNotFoundError
 */
export async function archiveItem(
  owner: string,
  projectNumber: string,
  id: string,
  archived = true
): Promise<void> {
  const args = [
    'project',
    'item-archive',
    projectNumber,
    '--owner',
    owner,
    '--id',
    id
  ];
  if (!archived) args.push('--undo');

  try {
    await execCliCommand(args);
  } catch (error) {
    handleCliError(error);
  }
}

/**
 * @throws ProjectNotFoundError
 */
export async function closeProject(
  owner: string,
  projectNumber: string,
  closed = true
): Promise<ProjectDetails> {
  const args = [
    'project',
    'close',
    projectNumber,
    '--owner',
    owner,
    '--format',
    'json'
  ];
  if (!closed) args.push('--undo');

  let details: string;

  try {
    details = await execCliCommand(args);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(details);
}

/**
 * @throws ProjectNotFoundError
 */
export async function copyProject(
  owner: string,
  projectNumber: string,
  targetOwner: string,
  title: string,
  drafts = false
): Promise<ProjectDetails> {
  let details: string;

  try {
    const args = [
      'project',
      'copy',
      projectNumber,
      '--source-owner',
      owner,
      '--target-owner',
      targetOwner,
      '--title',
      title,
      '--format',
      'json'
    ];
    if (drafts) args.push('--drafts');
    details = await execCliCommand(args);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(details);
}

/**
 * @throws ProjectNotFoundError
 */
export async function deleteItem(
  owner: string,
  projectNumber: string,
  id: string
): Promise<void> {
  try {
    await execCliCommand([
      'project',
      'item-delete',
      projectNumber,
      '--owner',
      owner,
      '--id',
      id
    ]);
  } catch (error) {
    handleCliError(error);
  }
}

/**
 * @throws ProjectNotFoundError
 */
export async function deleteProject(
  owner: string,
  projectNumber: string
): Promise<void> {
  try {
    await execCliCommand([
      'project',
      'delete',
      projectNumber,
      '--owner',
      owner
    ]);
  } catch (error) {
    handleCliError(error);
  }
}

/**
 * @param id - item id, or content id if editing title/body
 *
 * @throws FieldNotFoundError
 * @throws ItemNotFoundError
 * @throws ProjectNotFoundError
 * @throws SingleSelectOptionNotFoundError
 */
export async function editItem(
  projectId: string,
  id: string,
  edit: ItemEdit
): Promise<string> {
  if ((edit.field && !edit.fieldValue) || (!edit.field && edit.fieldValue)) {
    throw new Error(
      'Must supply both field and fieldValue if either is provided'
    );
  }

  const args = [
    'project',
    'item-edit',
    '--id',
    id,
    '--project-id',
    projectId,
    '--format',
    'json'
  ];

  if (edit.title !== undefined) {
    args.push('--title', edit.title);
  }

  if (edit.body !== undefined) {
    args.push('--body', edit.body);
  }

  if (edit.title !== undefined || edit.body !== undefined) {
    if (!id.startsWith('DI_')) {
      throw new Error('Must use draft issue content id to edit title or body');
    }

    if (edit.field) {
      throw new Error('Cannot edit field at same time as title or body');
    }
  }

  if (edit.field && edit.fieldValue !== undefined) {
    const octokit = getOctokit();
    let projectV2Item: FieldTypeResponse['projectV2Item'];

    try {
      const data = await octokit.graphql<FieldTypeResponse>(
        `query ($id: ID!, $field: String!) {
          projectV2Item: node(id: $id) {
            ... on ProjectV2Item {
              project {
                field(name: $field) {
                  ... on ProjectV2FieldCommon {
                    id
                    dataType
                  }
                }
              }
            }
          }
        }`,
        { id, field: edit.field }
      );
      projectV2Item = data.projectV2Item;
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        if (error.errors?.[0].type === 'NOT_FOUND') {
          const { path } = error.errors[0];
          if (path.length === 1) {
            throw new ProjectNotFoundError(error);
          } else if (path.length === 2 && path.at(1) === 'field') {
            throw new FieldNotFoundError(error);
          }
        }
      }

      throw error;
    }

    if (!projectV2Item.project) {
      throw new ItemNotFoundError();
    }

    if (projectV2Item.project.field === null) {
      throw new FieldNotFoundError();
    }

    args.push('--field-id', projectV2Item.project.field.id);

    switch (projectV2Item.project.field.dataType) {
      case 'DATE':
        // Convert potential datetimes to just the date
        args.push(
          '--date',
          new Date(edit.fieldValue).toISOString().split('T')[0]
        );
        break;

      // TODO - Support 'ITERATION'

      case 'NUMBER':
        args.push('--number', edit.fieldValue);
        break;

      case 'TEXT':
        args.push('--text', edit.fieldValue);
        break;

      case 'SINGLE_SELECT':
        try {
          const { projectV2: project } =
            await octokit.graphql<SingleSelectOptionIdResponse>(
              `query ($projectId: ID!, $field: String!, $name: String!) {
                  projectV2: node(id: $projectId) {
                    ... on ProjectV2 {
                      field(name: $field) {
                        ... on ProjectV2SingleSelectField {
                          options(names: [$name]) {
                            id
                          }
                        }
                      }
                    }
                  }
                }`,
              { projectId, field: edit.field, name: edit.fieldValue }
            );

          if (project.field.options.length === 0) {
            throw new SingleSelectOptionNotFoundError();
          }

          args.push('--single-select-option-id', project.field.options[0].id);
        } catch (error) {
          if (error instanceof GraphqlResponseError) {
            if (error.errors?.[0].type === 'NOT_FOUND') {
              const { path } = error.errors[0];
              if (path.length === 1) {
                throw new ProjectNotFoundError(error);
              } else if (path.length === 2 && path.at(1) === 'field') {
                throw new FieldNotFoundError(error);
              }
            }
          }

          throw error;
        }
        break;

      default:
        throw new Error('Unsupported field type');
    }
  }

  let output: string;

  try {
    output = await execCliCommand(args);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(output).id;
}

/**
 * @throws ProjectNotFoundError
 */
export async function editProject(
  owner: string,
  projectNumber: string,
  edit: ProjectEdit
): Promise<string> {
  const args = [
    'project',
    'edit',
    projectNumber,
    '--owner',
    owner,
    '--format',
    'json'
  ];

  if (edit.description !== undefined) {
    args.push('--description', edit.description);
  }

  if (edit.public !== undefined) {
    args.push('--visibility', edit.public ? 'PUBLIC' : 'PRIVATE');
  }

  if (edit.readme !== undefined) {
    args.push('--readme', edit.readme);
  }

  if (edit.title !== undefined) {
    args.push('--title', edit.title);
  }

  let output: string;

  try {
    output = await execCliCommand(args);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(output).id;
}

export async function findProject(
  owner: string,
  title: string,
  closed = false,
  limit?: string
): Promise<ProjectDetails | null> {
  const args = ['project', 'list', '--owner', owner, '--format', 'json'];

  if (closed) {
    args.push('--closed');
  }

  if (limit) {
    args.push('--limit', limit);
  }

  const { projects } = JSON.parse(await execCliCommand(args));

  for (const project of projects) {
    if (project.title === title) {
      return project;
    }
  }

  return null;
}

/**
 * @throws ProjectNotFoundError
 */
export async function findWorkflow(
  owner: string,
  projectNumber: string,
  name: string
): Promise<WorkflowDetails | null> {
  const octokit = getOctokit();

  const project = await getProject(owner, projectNumber);

  const pageIterator =
    octokit.graphql.paginate.iterator<ProjectWorkflowsResponse>(
      PROJECT_WORKFLOWS_QUERY,
      { projectId: project.id }
    );

  try {
    for await (const { projectV2 } of pageIterator) {
      for (const node of projectV2.workflows.nodes) {
        if (node.name === name) {
          return {
            id: node.id,
            name: node.name,
            number: node.number,
            enabled: node.enabled,
            projectId: project.id
          };
        }
      }
    }
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        throw new ProjectNotFoundError(error);
      }
    }

    throw error;
  }

  return null;
}

/**
 * @throws ProjectNotFoundError
 */
export async function getProject(
  owner: string,
  projectNumber: string
): Promise<ProjectDetails> {
  let details: string;

  try {
    details = await execCliCommand([
      'project',
      'view',
      projectNumber,
      '--owner',
      owner,
      '--format',
      'json'
    ]);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(details);
}

/**
 * @throws ProjectNotFoundError
 * @throws RepositoryNotFoundError
 */
export async function linkProjectToRepository(
  projectNumber: string,
  repository: string,
  linked = true
): Promise<string> {
  const octokit = getOctokit();

  const [owner, name] = repository.split('/');
  let repositoryId: string;

  try {
    const data = await octokit.graphql<RepositoryIdResponse>(
      `query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
        }
      }`,
      { owner, name }
    );
    repositoryId = data.repository.id;
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        throw new RepositoryNotFoundError(error);
      }
    }

    throw error;
  }

  try {
    await execCliCommand([
      'project',
      linked ? 'link' : 'unlink',
      projectNumber,
      '--owner',
      owner,
      '--repo',
      name
    ]);
  } catch (error) {
    handleCliError(error);
  }

  return repositoryId;
}

/**
 * @throws ProjectNotFoundError
 * @throws TeamNotFoundError
 */
export async function linkProjectToTeam(
  projectNumber: string,
  team: string,
  linked = true
): Promise<string> {
  const octokit = getOctokit();

  const [owner, name] = team.split('/');
  let teamId: string;

  try {
    const { organization } = await octokit.graphql<TeamIdResponse>(
      `query ($owner: String!, $name: String!) {
        organization(login: $owner) {
          team(slug: $name) {
            id
          }
        }
      }`,
      { owner, name }
    );
    if (!organization.team?.id) throw new TeamNotFoundError();
    teamId = organization.team.id;
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      if (error.errors?.[0].type === 'NOT_FOUND') {
        throw new TeamNotFoundError(error);
      }
    }

    throw error;
  }

  try {
    await execCliCommand([
      'project',
      linked ? 'link' : 'unlink',
      projectNumber,
      '--owner',
      owner,
      '--team',
      name
    ]);
  } catch (error) {
    handleCliError(error);
  }

  return teamId;
}

export async function getPullRequestState(url: string): Promise<string> {
  let details: string;

  try {
    details = await execCliCommand(['pr', 'view', url, '--json', 'state']);
  } catch (error) {
    handleCliError(error);
  }

  return JSON.parse(details).state;
}
