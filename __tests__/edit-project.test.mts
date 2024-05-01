import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/edit-project.js';
import { editProject } from '../src/lib.js';
import { mockGetBooleanInput, mockGetInput } from './utils.js';

vi.mock('@actions/core');
vi.mock('../src/lib');

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

// Spy the action's entrypoint
const editProjectActionSpy = vi.spyOn(index, 'editProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';

describe('editProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(editProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(editProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(editProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('can edit values', async () => {
    const title = 'New Title';
    const description = 'New Description';
    const readme = 'New Readme';
    const publicVisibility = true;

    mockGetInput({
      owner,
      'project-number': projectNumber,
      title,
      description,
      readme,
      public: publicVisibility.toString()
    });
    mockGetBooleanInput({ public: publicVisibility });
    vi.mocked(editProject).mockResolvedValue(projectId);

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(editProject).toHaveBeenCalledWith(owner, projectNumber, {
      title,
      description,
      readme,
      public: publicVisibility
    });
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    vi.mocked(editProject).mockResolvedValue(projectId);

    await index.editProjectAction();
    expect(editProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenLastCalledWith('id', projectId);
  });
});
