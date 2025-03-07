import * as core from '@actions/core';

import { deleteProject, ProjectNotFoundError } from './lib.js';

export async function deleteProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });

    // Optional inputs
    const failIfProjectNotFound = core.getBooleanInput(
      'fail-if-project-not-found'
    );

    try {
      await deleteProject(owner, projectNumber);
    } catch (error) {
      if (error instanceof ProjectNotFoundError && !failIfProjectNotFound) {
        return;
      }

      throw error;
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
