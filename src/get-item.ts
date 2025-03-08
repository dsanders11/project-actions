import * as core from '@actions/core';

import { getItem } from './lib.js';

export async function getItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const item = core.getInput('item', { required: true });

    // Optional inputs
    const field = core.getInput('field') || undefined;
    const failIfItemNotFound = core.getBooleanInput('fail-if-item-not-found');

    // Item might be the item ID, the content ID, or the content URL
    const fullItem = await getItem(owner, projectNumber, item, field);

    if (!fullItem) {
      if (failIfItemNotFound) core.setFailed(`Item not found: ${item}`);
      return;
    }

    core.setOutput('id', fullItem.id);
    core.setOutput('body', fullItem.content?.body ?? null);
    core.setOutput('content-id', fullItem.content?.id ?? null);
    core.setOutput('project-id', fullItem.projectId);
    core.setOutput('title', fullItem.content?.title ?? null);

    if (fullItem.type === 'ISSUE' || fullItem.type === 'PULL_REQUEST') {
      core.setOutput('url', fullItem.content.url);
    }

    if (fullItem.type !== 'REDACTED' && fullItem.field) {
      core.setOutput('field-id', fullItem.field.id);

      if (fullItem.field.value !== null) {
        core.setOutput('field-value', fullItem.field.value);
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
