import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/get-workflow';
import { getWorkflow } from '../src/lib';
import { mockGetBooleanInput, mockGetInput } from './utils';

vi.mock('@actions/core');
vi.mock('../src/lib');

// Spy the action's entrypoint
const getWorkflowActionSpy = vi.spyOn(index, 'getWorkflowAction');

const owner = 'dsanders11';
const projectNumber = '94';
const name = 'workflow-name';
const projectId = 'project-id';
const workflowId = 'workflow-id';
const number = '42';

describe('getWorkflowAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the number input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: number'
    );
  });

  it('handles workflow not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, number });
    mockGetBooleanInput({ 'fail-if-workflow-not-found': true });
    vi.mocked(getWorkflow).mockResolvedValue(null);

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      `Workflow not found: ${number}`
    );
  });

  it('can ignore item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, number });
    mockGetBooleanInput({ 'fail-if-workflow-not-found': false });
    vi.mocked(getWorkflow).mockResolvedValue(null);

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, number });
    vi.mocked(getWorkflow).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, number });
    vi.mocked(getWorkflow).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, number });
    vi.mocked(getWorkflow).mockResolvedValue({
      id: workflowId,
      name,
      number: parseInt(number),
      enabled: true,
      projectId
    });

    await index.getWorkflowAction();
    expect(getWorkflowActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(5);
    expect(core.setOutput).toHaveBeenCalledWith('id', workflowId);
    expect(core.setOutput).toHaveBeenCalledWith('name', name);
    expect(core.setOutput).toHaveBeenCalledWith('number', parseInt(number));
    expect(core.setOutput).toHaveBeenCalledWith('enabled', true);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });
});
