import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@actions/core';

import * as index from '../src/find-workflow';
import { findWorkflow } from '../src/lib';
import { mockGetBooleanInput, mockGetInput } from './utils';

vi.mock('@actions/core');
vi.mock('../src/lib');

// Spy the action's entrypoint
const findWorkflowActionSpy = vi.spyOn(index, 'findWorkflowAction');

const owner = 'dsanders11';
const projectNumber = '94';
const name = 'workflow-name';
const projectId = 'project-id';
const workflowId = 'workflow-id';
const workflowNumber = 42;

describe('findWorkflowAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires the project-number input', async () => {
    mockGetInput({ owner });

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: project-number'
    );
  });

  it('requires the name input', async () => {
    mockGetInput({ owner, 'project-number': projectNumber });

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      'Input required and not supplied: name'
    );
  });

  it('handles workflow not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, name });
    mockGetBooleanInput({ 'fail-if-workflow-not-found': true });
    vi.mocked(findWorkflow).mockResolvedValue(null);

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith(
      `Workflow not found: ${name}`
    );
  });

  it('can ignore item not found', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, name });
    mockGetBooleanInput({ 'fail-if-workflow-not-found': false });
    vi.mocked(findWorkflow).mockResolvedValue(null);

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it('handles generic errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, name });
    vi.mocked(findWorkflow).mockImplementation(() => {
      throw new Error('Server error');
    });

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('Server error');
  });

  it('stringifies non-errors', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, name });
    vi.mocked(findWorkflow).mockImplementation(() => {
      throw 42; // eslint-disable-line no-throw-literal
    });

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenLastCalledWith('42');
  });

  it('sets output', async () => {
    mockGetInput({ owner, 'project-number': projectNumber, name });
    vi.mocked(findWorkflow).mockResolvedValue({
      id: workflowId,
      name,
      number: workflowNumber,
      enabled: true,
      projectId
    });

    await index.findWorkflowAction();
    expect(findWorkflowActionSpy).toHaveReturned();

    expect(core.setOutput).toHaveBeenCalledTimes(5);
    expect(core.setOutput).toHaveBeenCalledWith('id', workflowId);
    expect(core.setOutput).toHaveBeenCalledWith('name', name);
    expect(core.setOutput).toHaveBeenCalledWith('number', workflowNumber);
    expect(core.setOutput).toHaveBeenCalledWith('enabled', true);
    expect(core.setOutput).toHaveBeenCalledWith('project-id', projectId);
  });
});
