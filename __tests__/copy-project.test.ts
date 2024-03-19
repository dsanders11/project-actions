import * as core from '@actions/core';

import * as index from '../src/copy-project';
import {
  copyProject,
  editItem,
  editProject,
  getDraftIssues,
  linkProjectToRepository,
  linkProjectToTeam
} from '../src/lib';
import { mockGetBooleanInput, mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const copyProjectActionSpy = jest.spyOn(index, 'copyProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const title = 'New Title';
const fieldCount = 4;
const itemCount = 50;
const shortDescription = 'Description';
const readme = 'README';
const url = 'url';
const templateView = JSON.stringify({
  foo: 'bar'
});

function mockCopyProject(newProjectId: string, newProjectNumber: number): void {
  jest.mocked(copyProject).mockResolvedValue({
    id: newProjectId,
    number: newProjectNumber,
    fields: {
      totalCount: fieldCount
    },
    items: {
      totalCount: itemCount
    },
    url,
    title,
    readme,
    shortDescription,
    public: true,
    closed: false,
    owner: {
      type: 'Organization',
      login: owner
    }
  });
}

describe('copyProjectAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the title input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: title'
    );
  });

  it('requires drafts if the template-view input is set', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'template-view': templateView
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Can only use template-view input if drafts are being copied'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, title });
    jest.mocked(copyProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, title });
    jest.mocked(copyProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, title });
    jest.mocked(copyProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('can change public visibility', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      public: 'true'
    });
    mockGetBooleanInput({ public: true });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();
    expect(editProject).toHaveBeenCalledWith(
      owner,
      newProjectNumber.toString(),
      {
        public: true
      }
    );
  });

  it('can link to repository', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    const repository = 'dsanders11/project-actions';
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'link-to-repository': repository
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();
    expect(linkProjectToRepository).toHaveBeenCalledTimes(1);
    expect(linkProjectToRepository).toHaveBeenCalledWith(
      newProjectNumber.toString(),
      repository
    );
  });

  it('can link to team', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    const team = 'foo/bar';
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'link-to-team': team
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();
    expect(linkProjectToTeam).toHaveBeenCalledTimes(1);
    expect(linkProjectToTeam).toHaveBeenCalledWith(
      newProjectNumber.toString(),
      team
    );
  });

  it('does not get draft issues if no template view', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(getDraftIssues).not.toHaveBeenCalled();
  });

  it('does not edit draft issue if no template changes', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'template-view': templateView
    });
    mockGetBooleanInput({ drafts: true });
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: 'item-id',
        content: {
          id: 'content-id',
          body: 'This is the item body',
          title: 'Item Title'
        }
      }
    ]);

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledTimes(1);
    expect(getDraftIssues).toHaveBeenCalledWith(newProjectId);
    expect(editItem).not.toHaveBeenCalled();
  });

  it('updates draft issue if template changes', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    const itemId = 'item-id';
    const contentId = 'content-id';
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'template-view': templateView
    });
    mockGetBooleanInput({ drafts: true });
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          id: contentId,
          body: 'This is the item {{ foo }}',
          title: 'Item {{ foo }}'
        }
      }
    ]);

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledTimes(1);
    expect(getDraftIssues).toHaveBeenCalledWith(newProjectId);
    expect(editItem).toHaveBeenCalledTimes(1);
    expect(editItem).toHaveBeenCalledWith(newProjectId, contentId, {
      body: 'This is the item bar',
      title: 'Item bar'
    });
  });

  it('edits draft issue fields if field comment', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    const itemId = 'item-id';
    const field = 'Opened';
    const fieldValue = '2023-01-01';
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'template-view': templateView
    });
    mockGetBooleanInput({ drafts: true });
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          id: 'content-id',
          body: `<!-- fields
          {
            "${field}": "${fieldValue}"
          }
          -->`,
          title: 'Item Title'
        }
      }
    ]);

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledTimes(1);
    expect(getDraftIssues).toHaveBeenCalledWith(newProjectId);
    expect(editItem).toHaveBeenCalledTimes(1);
    expect(editItem).toHaveBeenCalledWith(newProjectId, itemId, {
      field,
      fieldValue
    });
  });

  it('handles error during templating', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    const itemId = 'item-id';
    const contentId = 'content-id';
    const errorMessage = 'Generic error';
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      'template-view': templateView
    });
    mockGetBooleanInput({ drafts: true });
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          id: contentId,
          body: 'This is the item {{ foo }}',
          title: 'Item {{ foo }}'
        }
      }
    ]);
    jest.mocked(editItem).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledTimes(1);
    expect(getDraftIssues).toHaveBeenCalledWith(newProjectId);
    expect(core.debug).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledWith(
      `Error while doing template replacement on draft issue ${itemId}: ${errorMessage}`
    );
  });

  it('sets output', async () => {
    const newProjectId = 'project-id-2';
    const newProjectNumber = parseInt(projectNumber) + 1;
    mockCopyProject(newProjectId, newProjectNumber);
    mockGetInput({ owner, 'project-number': projectNumber, title });

    await index.copyProjectAction();
    expect(copyProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(11);
    expect(core.setOutput).toHaveBeenCalledWith('id', newProjectId);
    expect(core.setOutput).toHaveBeenCalledWith('url', url);
    expect(core.setOutput).toHaveBeenCalledWith('closed', false);
    expect(core.setOutput).toHaveBeenCalledWith('public', true);
    expect(core.setOutput).toHaveBeenCalledWith('field-count', fieldCount);
    expect(core.setOutput).toHaveBeenCalledWith('item-count', itemCount);
    expect(core.setOutput).toHaveBeenCalledWith('readme', readme);
    expect(core.setOutput).toHaveBeenCalledWith(
      'description',
      shortDescription
    );
    expect(core.setOutput).toHaveBeenCalledWith('title', title);
    expect(core.setOutput).toHaveBeenCalledWith('owner', owner);
    expect(core.setOutput).toHaveBeenCalledWith('number', newProjectNumber);
  });
});
