import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/edit-item.js';
import { ItemDetails, editItem, getItem } from '../src/lib.js';
import { mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

// Spy the action's entrypoint
const editItemActionSpy = vi.spyOn(index, 'editItemAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const item = 'content-url';
const itemId = 'item-id';

describe('editItemAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the item input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: item'
    );
  });

  it('requires the field-value input if field input set', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      field: 'Status'
    });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field-value'
    );
  });

  it('requires the field input if field-value input set', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      'field-value': 'Done'
    });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field'
    );
  });

  it('handles item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(editItem).mockResolvedValue(itemId);

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(`Item not found: ${item}`);
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { type: 'PullRequest' }
    } as ItemDetails);
    vi.mocked(editItem).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(editItem).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(editItem).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('can only set title/body for draft issues', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      title: 'New Title'
    });
    vi.mocked(getItem).mockResolvedValue({
      content: { type: 'PullRequest' }
    } as ItemDetails);

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Can only set title or body for draft issues'
    );
  });

  it('can edit a field', async () => {
    const field = 'Status';
    const fieldValue = 'Done';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      field,
      'field-value': fieldValue
    });
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { type: 'PullRequest' },
      projectId
    } as ItemDetails);
    vi.mocked(editItem).mockResolvedValue(itemId);

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(editItem).toHaveBeenCalledWith(projectId, itemId, {
      field,
      fieldValue
    });
  });

  it('can edit draft issue content', async () => {
    const title = 'New Title';
    const body = 'New Body';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      item,
      title,
      body
    });
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { type: 'DraftIssue' },
      projectId
    } as ItemDetails);
    vi.mocked(editItem).mockResolvedValue(itemId);

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(editItem).toHaveBeenCalledWith(projectId, itemId, { title, body });
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: { type: 'PullRequest' },
      projectId
    } as ItemDetails);
    vi.mocked(editItem).mockResolvedValue(itemId);

    await index.editItemAction();
    expect(editItemActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('id', itemId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });
});
