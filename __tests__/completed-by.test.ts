import * as core from '@actions/core';

import * as index from '../src/completed-by';
import {
  ProjectDetails,
  editItem,
  getDraftIssues,
  getProject,
  getPullRequestState
} from '../src/lib';
import { mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const completedByActionSpy = jest.spyOn(index, 'completedByAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const itemId = 'item-id';
const field = 'Status';
const fieldValue = 'Done';

describe('completedByAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the field input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field'
    );
  });

  it('requires the field-value input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, field });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field-value'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest.mocked(getProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest.mocked(getProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest.mocked(getProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('does nothing for items without "Completed by"', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          __typename: 'DraftIssue',
          id: 'content-id',
          body: 'This is the item body',
          title: 'Item Title'
        }
      }
    ]);

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledWith(projectId);
    expect(getPullRequestState).not.toHaveBeenCalled();
    expect(editItem).not.toHaveBeenCalled();
  });

  it('sets field value if item completed', async () => {
    const itemUrl = 'https://github.com/dsanders11/project-actions/pull/2';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          __typename: 'DraftIssue',
          id: 'content-id',
          body: `Completed by ${itemUrl}`,
          title: 'Item Title'
        }
      }
    ]);
    jest.mocked(getPullRequestState).mockResolvedValue('MERGED');

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledWith(projectId);
    expect(getPullRequestState).toHaveBeenCalledTimes(1);
    expect(getPullRequestState).toHaveBeenCalledWith(itemUrl);
    expect(editItem).toHaveBeenCalledWith(projectId, itemId, {
      field,
      fieldValue
    });
  });

  it('does not set field value if item not completed', async () => {
    const itemUrl = 'https://github.com/dsanders11/project-actions/pull/2';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          __typename: 'DraftIssue',
          id: 'content-id',
          body: `Completed by ${itemUrl}`,
          title: 'Item Title'
        }
      }
    ]);
    jest.mocked(getPullRequestState).mockResolvedValue('OPEN');

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledWith(projectId);
    expect(getPullRequestState).toHaveBeenCalledTimes(1);
    expect(getPullRequestState).toHaveBeenCalledWith(itemUrl);
    expect(editItem).not.toHaveBeenCalled();
  });

  it('does not set field value if not all items completed', async () => {
    const itemUrl1 = 'https://github.com/dsanders11/project-actions/pull/2';
    const itemUrl2 = 'https://github.com/dsanders11/project-actions/pull/3';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          __typename: 'DraftIssue',
          id: 'content-id',
          body: `
            Completed by ${itemUrl1}
            Completed by ${itemUrl2}
          `,
          title: 'Item Title'
        }
      }
    ]);
    jest
      .mocked(getPullRequestState)
      .mockResolvedValueOnce('MERGED')
      .mockResolvedValueOnce('OPEN');

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledWith(projectId);
    expect(getPullRequestState).toHaveBeenCalledTimes(2);
    expect(getPullRequestState).toHaveBeenCalledWith(itemUrl1);
    expect(getPullRequestState).toHaveBeenCalledWith(itemUrl2);
    expect(editItem).not.toHaveBeenCalled();
  });

  it('handles error while getting linked PR state', async () => {
    const itemUrl = 'https://github.com/dsanders11/project-actions/pull/2';
    const errorMessage = 'Generic error';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      field,
      'field-value': fieldValue
    });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(getDraftIssues).mockResolvedValue([
      {
        id: itemId,
        content: {
          __typename: 'DraftIssue',
          id: 'content-id',
          body: `Completed by ${itemUrl}`,
          title: 'Item Title'
        }
      }
    ]);
    jest.mocked(getPullRequestState).mockRejectedValue(new Error(errorMessage));

    await index.completedByAction();
    expect(completedByActionSpy).toHaveReturned();

    expect(getDraftIssues).toHaveBeenCalledWith(projectId);
    expect(getPullRequestState).toHaveBeenCalledTimes(1);
    expect(getPullRequestState).toHaveBeenCalledWith(itemUrl);
    expect(editItem).not.toHaveBeenCalled();
    expect(core.debug).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledWith(
      `Error while checking linked PR state for draft issue ${itemId}: ${errorMessage}`
    );
  });
});
