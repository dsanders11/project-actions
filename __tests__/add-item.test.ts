import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/add-item.js';
import {
  ItemDetails,
  ProjectDetails,
  addItem,
  editItem,
  getItem,
  getProject
} from '../src/lib.js';
import { mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

// Spy the action's entrypoint
const addItemActionSpy = vi.spyOn(index, 'addItemAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const contentUrl = 'content-url';
const itemId = 'item-id';

describe('addItemAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the content-url input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: content-url'
    );
  });

  it('requires the field-value input if field input set', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl,
      field: 'Opened'
    });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field-value'
    );
  });

  it('requires the field input if field-value input set', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl,
      'field-value': '42'
    });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: field'
    );
  });

  it('handles generic errors', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl
    });
    vi.mocked(addItem).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl
    });
    vi.mocked(addItem).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets the field value', async () => {
    const field = 'My Field';
    const fieldValue = '42';
    const contentId = 'content-id';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl,
      field,
      'field-value': fieldValue
    });
    vi.mocked(addItem).mockResolvedValue(itemId);
    vi.mocked(getProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: {
        id: contentId
      },
      type: 'DRAFT_ISSUE'
    } as ItemDetails);

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(editItem).toHaveBeenCalledWith(projectId, contentId, {
      field,
      fieldValue
    });
  });

  it('sets assignees after adding', async () => {
    const assigneeLogins = ['octocat', 'dsanders11'];
    const contentId = 'content-id';
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl,
      assignees: assigneeLogins.join(',')
    });
    vi.mocked(addItem).mockResolvedValue(itemId);
    vi.mocked(getProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);
    vi.mocked(editItem).mockResolvedValue();
    vi.mocked(getItem).mockResolvedValue({
      id: itemId,
      content: {
        id: contentId
      },
      type: 'DRAFT_ISSUE'
    } as ItemDetails);

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(editItem).toHaveBeenCalledWith(
      projectId,
      contentId,
      expect.objectContaining({
        assignees: assigneeLogins
      })
    );
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenLastCalledWith('id', itemId);
  });

  it('sets output', async () => {
    mockGetInput({
      owner,
      'project-number': projectNumber,
      'content-url': contentUrl
    });
    vi.mocked(addItem).mockResolvedValue(itemId);

    await index.addItemAction();
    expect(addItemActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenLastCalledWith('id', itemId);
  });
});
