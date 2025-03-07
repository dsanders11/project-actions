import * as core from '@actions/core';

import {
  getProject,
  linkProjectToRepository,
  linkProjectToTeam
} from './lib.js';

export async function linkProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });

    // Optional inputs
    const repository = core.getInput('repository');
    const team = core.getInput('team');
    const linked = core.getBooleanInput('linked');

    if (!repository && !team) {
      core.setFailed('Input required and not supplied: repository or team');
      return;
    }

    const project = await getProject(owner, projectNumber);

    if (repository) {
      const repositoryId = await linkProjectToRepository(
        projectNumber,
        repository,
        linked
      );
      core.setOutput('repository-id', repositoryId);
    } else {
      const teamId = await linkProjectToTeam(projectNumber, team, linked);
      core.setOutput('team-id', teamId);
    }

    core.setOutput('project-id', project.id);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
