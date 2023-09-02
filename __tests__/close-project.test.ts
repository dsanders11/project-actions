import * as core from '@actions/core';

import * as index from '../src/close-project';
import { ProjectDetails, closeProject } from '../src/lib';
import { mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const closeProjectActionSpy = jest.spyOn(index, 'closeProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';

describe('closeProjectAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    jest.mocked(closeProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(closeProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(closeProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest
      .mocked(closeProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);

    await index.closeProjectAction();
    expect(closeProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenLastCalledWith('id', projectId);
  });
});
