import * as core from '@actions/core';

import { findWorkflow } from './lib.js';

export async function findWorkflowAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const name = core.getInput('name', { required: true });

    // Optional inputs
    const failIfWorkflowNotFound = core.getBooleanInput(
      'fail-if-workflow-not-found'
    );

    const workflow = await findWorkflow(owner, projectNumber, name);

    if (!workflow) {
      if (failIfWorkflowNotFound) core.setFailed(`Workflow not found: ${name}`);
      return;
    }

    core.setOutput('id', workflow.id);
    core.setOutput('name', workflow.name);
    core.setOutput('number', workflow.number);
    core.setOutput('enabled', workflow.enabled);
    core.setOutput('project-id', workflow.projectId);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
