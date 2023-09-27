import * as core from '@actions/core';

import * as index from '../src/delete-item';
import { ItemDetails, deleteItem, getItem } from '../src/lib';
import { mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const deleteItemActionSpy = jest.spyOn(index, 'deleteItemAction');

const owner = 'dsanders11';
const projectNumber = '94';
const item = 'content-url';
const itemId = 'item-id';

describe('deleteItemAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    jest.mocked(deleteItem).mockResolvedValue();

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(`Item not found: ${item}`);
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    jest.mocked(deleteItem).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    jest.mocked(deleteItem).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    jest.mocked(deleteItem).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('passes inputs correctly', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, item });
    jest.mocked(getItem).mockResolvedValue({ id: itemId } as ItemDetails);
    jest.mocked(deleteItem).mockResolvedValue();

    await index.deleteItemAction();
    expect(deleteItemActionSpy).toHaveReturned();

    expect(deleteItem).toHaveBeenCalledTimes(1);
    expect(deleteItem).toHaveBeenLastCalledWith(owner, projectNumber, itemId);
  });
});
