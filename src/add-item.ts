import * as core from '@actions/core';

import {
  type ItemEdit,
  addItem,
  editItem,
  getItem,
  getProject
} from './lib.js';

export async function addItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const contentUrl = core.getInput('content-url', { required: true });

    // Optional inputs
    const field = core.getInput('field');
    const fieldValue = core.getInput('field-value', { required: !!field });
    const assignees = core.getInput('assignees');

    if (!!fieldValue && !field) {
      core.setFailed('Input required and not supplied: field');
      return;
    }

    const itemId = await addItem(owner, projectNumber, contentUrl);

    const assigneeLogins = assignees
      ? assignees
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : undefined;

    if (fieldValue || assigneeLogins) {
      const project = await getProject(owner, projectNumber);

      const edit: ItemEdit = {};

      if (fieldValue) {
        edit.field = field;
        edit.fieldValue = fieldValue;
      }

      if (assigneeLogins) {
        edit.assignees = assigneeLogins;
      }

      // Project was just found above
      const fullItem = await getItem(owner, projectNumber, itemId);

      if (!fullItem) {
        core.setFailed(`Item not found: ${itemId}`);
        return;
      }

      if (fullItem.type === 'DRAFT_ISSUE') {
        await editItem(project.id, fullItem.content.id, edit);
      } else {
        await editItem(project.id, itemId, edit);
      }
    }

    core.setOutput('id', itemId);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
