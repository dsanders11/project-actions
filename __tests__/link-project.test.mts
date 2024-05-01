import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/link-project.js';
import {
  ProjectDetails,
  getProject,
  linkProjectToRepository,
  linkProjectToTeam
} from '../src/lib.js';
import { mockGetBooleanInput, mockGetInput } from './utils.js';

const { ProjectNotFoundError } =
  await vi.importActual<typeof import('../src/lib.js')>('../src/lib');

vi.mock('@actions/core');
vi.mock('../src/lib');

// Spy the action's entrypoint
const linkProjectActionSpy = vi.spyOn(index, 'linkProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const repository = 'dsanders11/project-actions';
const repositoryId = 'bar';
const team = 'dsanders11-playground-org/maintainers';
const teamId = 'baz';

describe('linkProjectAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires either the repository or team input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: repository or team'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    vi.mocked(getProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    vi.mocked(getProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    vi.mocked(getProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('can link a repository', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    mockGetBooleanInput({ linked: true });
    vi.mocked(getProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);
    vi.mocked(linkProjectToRepository).mockResolvedValue(repositoryId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToRepository).toHaveBeenCalledTimes(1);
    expect(linkProjectToRepository).toHaveBeenLastCalledWith(
      projectNumber,
      repository,
      true
    );
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'repository-id',
      repositoryId
    );
    expect(core.setOutput).toHaveBeenLastCalledWith('project-id', projectId);
  });

  it('can link a team', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, team });
    mockGetBooleanInput({ linked: true });
    vi.mocked(getProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);
    vi.mocked(linkProjectToTeam).mockResolvedValue(teamId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToTeam).toHaveBeenCalledTimes(1);
    expect(linkProjectToTeam).toHaveBeenLastCalledWith(
      projectNumber,
      team,
      true
    );
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('team-id', teamId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });

  it('can unlink', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, team });
    mockGetBooleanInput({ linked: false });
    vi.mocked(getProject).mockResolvedValue({
      id: projectId
    } as ProjectDetails);
    vi.mocked(linkProjectToTeam).mockResolvedValue(teamId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToTeam).toHaveBeenCalledTimes(1);
    expect(linkProjectToTeam).toHaveBeenLastCalledWith(
      projectNumber,
      team,
      false
    );
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('team-id', teamId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });
});
