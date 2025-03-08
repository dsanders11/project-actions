import * as core from '@actions/core';

import { getWorkflow } from './lib.js';

export async function getWorkflowAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const number = parseInt(core.getInput('number', { required: true }));

    // Optional inputs
    const failIfWorkflowNotFound = core.getBooleanInput(
      'fail-if-workflow-not-found'
    );

    const workflow = await getWorkflow(owner, projectNumber, number);

    if (!workflow) {
      if (failIfWorkflowNotFound) {
        core.setFailed(`Workflow not found: ${number}`);
      }
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
