import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/delete-project.js';
import { deleteProject } from '../src/lib.js';
import { mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

// Spy the action's entrypoint
const deleteProjectActionSpy = vi.spyOn(index, 'deleteProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';

describe('deleteProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.deleteProjectAction();
    expect(deleteProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(deleteProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.deleteProjectAction();
    expect(deleteProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(deleteProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.deleteProjectAction();
    expect(deleteProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(deleteProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.deleteProjectAction();
    expect(deleteProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('passes inputs correctly', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(deleteProject).mockResolvedValue();

    await index.deleteProjectAction();
    expect(deleteProjectActionSpy).toHaveReturned();

    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(deleteProject).toHaveBeenLastCalledWith(owner, projectNumber);
  });
});
