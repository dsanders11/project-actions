import * as core from '@actions/core';

import * as index from '../src/link-project';
import {
  ProjectDetails,
  getProject,
  linkProjectToRepository,
  linkProjectToTeam
} from '../src/lib';
import { mockGetBooleanInput, mockGetInput } from './utils';

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

jest.mock('@actions/core');
jest.mock('../src/lib');

// Spy the action's entrypoint
const linkProjectActionSpy = jest.spyOn(index, 'linkProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const repository = 'dsanders11/project-actions';
const repositoryId = 'bar';
const team = 'dsanders11-playground-org/maintainers';
const teamId = 'baz';

describe('linkProjectAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    jest.mocked(getProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    jest.mocked(getProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, repository });
    jest.mocked(getProject).mockImplementation(() => {
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
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(linkProjectToRepository).mockResolvedValue(repositoryId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToRepository).toHaveBeenCalledTimes(1);
    expect(linkProjectToRepository).toHaveBeenLastCalledWith(
      projectId,
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
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(linkProjectToTeam).mockResolvedValue(teamId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToTeam).toHaveBeenCalledTimes(1);
    expect(linkProjectToTeam).toHaveBeenLastCalledWith(projectId, team, true);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('team-id', teamId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });

  it('can unlink', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, team });
    mockGetBooleanInput({ linked: false });
    jest
      .mocked(getProject)
      .mockResolvedValue({ id: projectId } as ProjectDetails);
    jest.mocked(linkProjectToTeam).mockResolvedValue(teamId);

    await index.linkProjectAction();
    expect(linkProjectActionSpy).toHaveReturned();

    expect(linkProjectToTeam).toHaveBeenCalledTimes(1);
    expect(linkProjectToTeam).toHaveBeenLastCalledWith(projectId, team, false);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('team-id', teamId);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });
});
