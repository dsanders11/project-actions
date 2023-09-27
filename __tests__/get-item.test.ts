import * as core from '@actions/core';

import * as index from '../src/get-item';
import { getItem } from '../src/lib';
import { mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const getItemActionSpy = jest.spyOn(index, 'getItemAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const item = 'content-url';
const itemId = 'item-id';

describe('getItemAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the item input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: item'
    );
  });

  it('handles item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockResolvedValue(null);

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(`Item not found: ${item}`);
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    const url = 'https://github.com/dsanders11/project-actions/pull/2';
    const contentId = 'content-id';
    const title = 'Pull Request Title';
    const body = 'Pull Request Description';
    const fieldId = 'field-id';
    const fieldValue = 'field-value';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      field: 'Status'
    });
    jest.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { id: contentId, type: 'PullRequest', url, title, body },
      field: { id: fieldId, value: fieldValue },
      projectId
    });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(8);
    expect(core.setOutput).toHaveBeenCalledWith('id', itemId);
    expect(core.setOutput).toHaveBeenCalledWith('body', body);
    expect(core.setOutput).toHaveBeenCalledWith('title', title);
    expect(core.setOutput).toHaveBeenCalledWith('url', url);
    expect(core.setOutput).toHaveBeenCalledWith('content-id', contentId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
    expect(core.setOutput).toHaveBeenCalledWith('field-id', fieldId);
    expect(core.setOutput).toHaveBeenCalledWith('field-value', fieldValue);
  });

  it('handles field with no value set', async () => {
    const url = 'https://github.com/dsanders11/project-actions/pull/2';
    const contentId = 'content-id';
    const title = 'Pull Request Title';
    const body = 'Pull Request Description';
    const fieldId = 'field-id';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      field: 'Status'
    });
    jest.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { id: contentId, type: 'PullRequest', url, title, body },
      field: { id: fieldId, value: null },
      projectId
    });

    await index.getItemAction();
    expect(getItemActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(7);
    expect(core.setOutput).toHaveBeenCalledWith('id', itemId);
    expect(core.setOutput).toHaveBeenCalledWith('body', body);
    expect(core.setOutput).toHaveBeenCalledWith('title', title);
    expect(core.setOutput).toHaveBeenCalledWith('url', url);
    expect(core.setOutput).toHaveBeenCalledWith('content-id', contentId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
    expect(core.setOutput).toHaveBeenCalledWith('field-id', fieldId);
  });
});
