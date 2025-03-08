import * as core from '@actions/core';

import {
  editItem,
  getDraftIssues,
  getProject,
  getPullRequestState
} from './lib.js';

export async function completedByAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const field = core.getInput('field', { required: true });
    const fieldValue = core.getInput('field-value', { required: true });

    const project = await getProject(owner, projectNumber);
    const draftIssues = await getDraftIssues(project.id);

    // Find issues with 'Completed by <url>' lines
    for (const draftIssue of draftIssues) {
      const { content } = draftIssue;

      const matches = content.body.matchAll(
        /^[ \t]*Completed by (https:\/\/github.com\/[^ \t\n]*)[ \t\n]*$/gim
      );

      let allMerged = true;
      let matchesFound = false;

      for (const match of matches) {
        try {
          matchesFound = true;

          const url = match[1];
          const prState = await getPullRequestState(url);

          if (prState !== 'MERGED') {
            core.info(
              `Linked pull request ${url} on ${draftIssue.id} is NOT merged, stopping checks`
            );
            allMerged = false;
            break;
          } else {
            core.info(
              `Linked pull request ${url} on ${draftIssue.id} is merged`
            );
          }
        } catch (error) {
          // Since there's an error, don't know the state of the linked pull request
          allMerged = false;

          let message = error?.toString();

          if (error instanceof Error) {
            message = error.message;
            if (error.stack) core.debug(error.stack);
          }

          core.error(
            `Error while checking linked PR state for draft issue ${draftIssue.id}: ${message}`
          );
        }
      }

      if (matchesFound && allMerged) {
        core.info(
          `All linked pull requests merged, marking ${draftIssue.id} as complete`
        );
        await editItem(project.id, draftIssue.id, { field, fieldValue });
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
