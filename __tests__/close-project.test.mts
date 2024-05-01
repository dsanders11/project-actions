import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/close-project.js';
import { ProjectDetails, closeProject } from '../src/lib.js';
import { mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

// Spy the action's entrypoint
const closeProjectActionSpy = vi.spyOn(index, 'closeProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';

describe('closeProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(closeProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(closeProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(closeProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(closeProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenLastCalledWith('id', projectId);
  });
});
