import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/find-project.js';
import { findProject } from '../src/lib.js';
import { mockGetBooleanInput, mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

// Spy the action's entrypoint
const findProjectActionSpy = vi.spyOn(index, 'findProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const fieldCount = 4;
const itemCount = 50;
const shortDescription = 'Description';
const title = 'My Title';
const readme = 'README';
const url = 'url';

const mockProject = {
  id: projectId,
  number: parseInt(projectNumber),
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
    type: 'Organization' as const,
    login: owner
  }
};

describe('findProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the title input', async () => {
    mockGetInput({ owner });

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: title'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, title });
    mockGetBooleanInput({ 'fail-if-project-not-found': true });
    vi.mocked(findProject).mockResolvedValue(null);

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      `Project not found: ${title}`
    );
  });

  it('can ignore project not found', async () => {
    mockGetInput({ owner, title });
    mockGetBooleanInput({ 'fail-if-project-not-found': false });
    vi.mocked(findProject).mockResolvedValue(null);

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, title });
    vi.mocked(findProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, title });
    vi.mocked(findProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('finds closed projects', async () => {
    mockGetInput({ owner, title });
    mockGetBooleanInput({ 'include-closed': true });
    vi.mocked(findProject).mockResolvedValue(mockProject);

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(findProject).toHaveBeenCalledWith(owner, title, true, '');
  });

  it('can set limit', async () => {
    mockGetInput({ owner, title, limit: '50' });
    mockGetBooleanInput({});
    vi.mocked(findProject).mockResolvedValue(mockProject);

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(findProject).toHaveBeenCalledWith(owner, title, false, '50');
  });

  it('sets output', async () => {
    mockGetInput({ owner, title });
    vi.mocked(findProject).mockResolvedValue(mockProject);

    await index.findProjectAction();
    expect(findProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(10);
    expect(core.setOutput).toHaveBeenCalledWith('id', projectId);
    expect(core.setOutput).toHaveBeenCalledWith('url', url);
    expect(core.setOutput).toHaveBeenCalledWith('closed', false);
    expect(core.setOutput).toHaveBeenCalledWith('public', true);
    expect(core.setOutput).toHaveBeenCalledWith('field-count', fieldCount);
    expect(core.setOutput).toHaveBeenCalledWith('item-count', itemCount);
    expect(core.setOutput).toHaveBeenCalledWith(
      'number',
      parseInt(projectNumber)
    );
    expect(core.setOutput).toHaveBeenCalledWith('readme', readme);
    expect(core.setOutput).toHaveBeenCalledWith(
      'description',
      shortDescription
    );
    expect(core.setOutput).toHaveBeenCalledWith('title', title);
  });
});
