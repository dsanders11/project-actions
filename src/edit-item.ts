import * as core from '@actions/core';

import { ItemEdit, editItem, getItem } from './lib';

export async function editItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const item = core.getInput('item', { required: true });

    // Optional inputs
    const title = core.getInput('title');
    const body = core.getInput('body');
    const field = core.getInput('field');
    const fieldValue = core.getInput('field-value', { required: !!field });
    const failIfItemNotFound = core.getBooleanInput('fail-if-item-not-found');

    if (!!fieldValue && !field) {
      core.setFailed('Input required and not supplied: field');
      return;
    }

    // Item might be the item ID, the content ID, or the content URL
    const fullItem = await getItem(owner, projectNumber, item);

    if (!fullItem) {
      if (failIfItemNotFound) core.setFailed(`Item not found: ${item}`);
      return;
    }

    if (fullItem.type === 'REDACTED') {
      core.setFailed('Cannot edit redacted items');
      return;
    }

    if (fullItem.type !== 'DRAFT_ISSUE' && (!!title || !!body)) {
      core.setFailed('Can only set title or body for draft issues');
      return;
    }

    const edit: ItemEdit = {};

    if (title) edit.title = title;
    if (body) edit.body = body;
    if (field) {
      edit.field = field;
      edit.fieldValue = fieldValue;
    }

    await editItem(fullItem.projectId, fullItem.id, edit);

    core.setOutput('id', fullItem.id);
    core.setOutput('project-id', fullItem.projectId);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
