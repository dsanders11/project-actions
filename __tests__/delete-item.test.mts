import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/delete-item.js';
import { ItemDetails, deleteItem, getItem } from '../src/lib.js';
import { mockGetBooleanInput, mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

// Spy the action's entrypoint
const deleteItemActionSpy = vi.spyOn(index, 'deleteItemAction');

const owner = 'dsanders11';
const projectNumber = '94';
const item = 'content-url';
const itemId = 'item-id';

describe('deleteItemAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the item input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: item'
    );
  });

  it('handles item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    mockGetBooleanInput({ 'fail-if-item-not-found': true });
    vi.mocked(deleteItem).mockResolvedValue();

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(`Item not found: ${item}`);
  });

  it('can ignore item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    mockGetBooleanInput({ 'fail-if-item-not-found': false });
    vi.mocked(getItem).mockResolvedValue(null);

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    vi.mocked(deleteItem).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    vi.mocked(deleteItem).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    vi.mocked(deleteItem).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('passes inputs correctly', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    vi.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    vi.mocked(deleteItem).mockResolvedValue();

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(deleteItem).toHaveBeenCalledTimes(1);
    expect(deleteItem).toHaveBeenLastCalledWith(owner, projectNumber, itemId);
  });
});
