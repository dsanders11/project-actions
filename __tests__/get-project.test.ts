import * as core from '@actions/core';

import * as index from '../src/get-project';
import { getProject } from '../src/lib';
import { mockGetInput } from './utils';

jest.mock('@actions/core');
jest.mock('../src/lib');

const { ProjectNotFoundError } = jest.requireActual('../src/lib');

// Spy the action's entrypoint
const getProjectActionSpy = jest.spyOn(index, 'getProjectAction');

const owner = 'dsanders11';
const projectNumber = '94';
const projectId = 'project-id';
const fieldCount = 4;
const itemCount = 50;
const shortDescription = 'Description';
const title = 'Title';
const readme = 'README';
const url = 'url';

describe('getProjectAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.getProjectAction();
    expect(getProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('handles project not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(getProject).mockImplementation(() => {
      throw new ProjectNotFoundError();
    });

    await index.getProjectAction();
    expect(getProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Project not found');
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(getProject).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.getProjectAction();
    expect(getProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(getProject).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.getProjectAction();
    expect(getProjectActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });
    jest.mocked(getProject).mockResolvedValue({
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
        type: 'Organization',
        login: owner
      }
    });

    await index.getProjectAction();
    expect(getProjectActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(9);
    expect(core.setOutput).toHaveBeenCalledWith('id', projectId);
    expect(core.setOutput).toHaveBeenCalledWith('url', url);
    expect(core.setOutput).toHaveBeenCalledWith('closed', false);
    expect(core.setOutput).toHaveBeenCalledWith('public', true);
    expect(core.setOutput).toHaveBeenCalledWith('field-count', fieldCount);
    expect(core.setOutput).toHaveBeenCalledWith('item-count', itemCount);
    expect(core.setOutput).toHaveBeenCalledWith('readme', readme);
    expect(core.setOutput).toHaveBeenCalledWith(
      'description',
      shortDescription
    );
    expect(core.setOutput).toHaveBeenCalledWith('title', title);
  });
});
