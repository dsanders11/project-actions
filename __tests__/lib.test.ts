import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { GraphqlResponseError } from '@octokit/graphql';

import { execCliCommand, getOctokit } from '../src/helpers.js';
import * as lib from '../src/lib.js';

type MockGraphqlResponseErrorError = {
  type: string;
  message: string;
  path: string[];
};

vi.mock('@octokit/graphql');
vi.mock('../src/helpers');

function createMockGraphqlResponseError(
  errors: MockGraphqlResponseErrorError[]
): Error {
  const error = Object.create(GraphqlResponseError.prototype);
  return Object.assign(error, { errors });
}

type OcotkitType = ReturnType<typeof getOctokit>;

type MockOctokitType = {
  graphql: OcotkitType['graphql'] & {
    paginate: Mock & {
      iterator: Mock;
    };
  };
};

function mockGetOctokit(): MockOctokitType {
  const mockOctokit = {
    graphql: vi.fn()
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockOctokit.graphql as any).paginate = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockOctokit.graphql as any).paginate.iterator = vi.fn();
  (getOctokit as Mock).mockReturnValue(mockOctokit);

  return mockOctokit as unknown as MockOctokitType;
}

function mockProjectNotFoundError(): void {
  vi.mocked(execCliCommand).mockRejectedValue(
    new Error('Could not resolve to a ProjectV2')
  );
}

describe('lib', () => {
  const itemUrl = 'https://github.com/dsanders11/project-actions/issues/1';
  const owner = 'dsanders11';
  const projectId = 'project-id';
  const projectNumber = '41';
  const projectTitle = 'My Cool Project';

  const workflow = {
    id: '42',
    name: 'workflow-name',
    number: 42,
    enabled: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCliError', () => {
    it('handles project not found', async () => {
      expect(() =>
        lib.handleCliError(new Error('Could not resolve to a ProjectV2'))
      ).toThrow(lib.ProjectNotFoundError);
    });

    it('handles repository not found', async () => {
      expect(() =>
        lib.handleCliError(new Error('Could not resolve to a Repository'))
      ).toThrow(lib.RepositoryNotFoundError);
    });

    it('bubbles up other errors', async () => {
      const error = new Error('Generic error');
      expect(() => lib.handleCliError(error)).toThrow(error);
    });
  });

  describe('getAllItems', () => {
    it('handles project not found', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getAllItems(projectId)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getAllItems(projectId)).rejects.toBe(error);
    });

    it('returns all items', async () => {
      const items: lib.ProjectItem[] = [
        {
          id: 'DI_one',
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One'
          },
          type: 'DRAFT_ISSUE'
        },
        {
          id: 'PR_two',
          content: {
            id: 'content-id-two',
            body: 'Body Two',
            title: 'Title Two',
            url: 'foobar'
          },
          type: 'PULL_REQUEST'
        },
        {
          id: 'I_three',
          content: {
            id: 'content-id-three',
            body: 'Body three',
            title: 'Title three',
            url: 'foobar-two'
          },
          type: 'ISSUE'
        },
        {
          id: 'REDACTED_foo',
          content: null,
          type: 'REDACTED'
        }
      ];
      const mockOctokit = mockGetOctokit();
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });
      await expect(lib.getAllItems(projectId)).resolves.toEqual(items);
    });
  });

  describe('getDraftIssues', () => {
    it('handles project not found', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getDraftIssues(projectId)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getDraftIssues(projectId)).rejects.toBe(error);
    });

    it('returns only draft items', async () => {
      const draftItems: lib.DraftIssueItem[] = [
        {
          id: 'DI_one',
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One'
          },
          type: 'DRAFT_ISSUE'
        },
        {
          id: 'DI_two',
          content: {
            id: 'content-id-two',
            body: 'Body Two',
            title: 'Title Two'
          },
          type: 'DRAFT_ISSUE'
        }
      ];

      const items: lib.ProjectItem[] = [
        {
          id: 'PR_two',
          content: {
            id: 'content-id-two',
            body: 'Body Two',
            title: 'Title Two',
            url: 'foobar'
          },
          type: 'PULL_REQUEST'
        },
        {
          id: 'REDACTED_foo',
          content: null,
          type: 'REDACTED'
        },
        ...draftItems,
        {
          id: 'I_three',
          content: {
            id: 'content-id-three',
            body: 'Body three',
            title: 'Title three',
            url: 'foobar-two'
          },
          type: 'ISSUE'
        }
      ];

      const mockOctokit = mockGetOctokit();
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });
      await expect(lib.getDraftIssues(projectId)).resolves.toEqual(draftItems);
    });
  });

  describe('addItem', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.addItem(owner, projectNumber, itemUrl)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('returns item ID', async () => {
      const itemId = 'item-id';
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await expect(lib.addItem(owner, projectNumber, itemUrl)).resolves.toEqual(
        itemId
      );
    });
  });

  describe('archiveItem', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(
        lib.archiveItem(owner, projectNumber, 'foobar')
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('can unarchive items', async () => {
      vi.mocked(execCliCommand).mockResolvedValue('');
      await lib.archiveItem(owner, projectNumber, 'foobar', false);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--undo'])
      );
    });
  });

  describe('closeProject', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.closeProject(owner, projectNumber)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('can reopen projects', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(
        lib.closeProject(owner, projectNumber, false)
      ).resolves.toEqual({
        id: projectId
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--undo'])
      );
    });

    it('returns project details', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(lib.closeProject(owner, projectNumber)).resolves.toEqual({
        id: projectId
      });
    });
  });

  describe('copyProject', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(
        lib.copyProject(owner, projectNumber, owner, 'new title')
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('can copy draft issues', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(
        lib.copyProject(owner, projectNumber, owner, 'new title', true)
      ).resolves.toEqual({
        id: projectId
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--drafts'])
      );
    });

    it('returns project details', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(
        lib.copyProject(owner, projectNumber, owner, 'new title')
      ).resolves.toEqual({
        id: projectId
      });
    });
  });

  describe('deleteItem', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(
        lib.deleteItem(owner, projectNumber, 'foobar')
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('passes arguments correctly', async () => {
      vi.mocked(execCliCommand).mockResolvedValue('');
      await lib.deleteItem(owner, projectNumber, 'foobar');
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining([owner, projectNumber])
      );
    });
  });

  describe('deleteProject', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.deleteProject(owner, projectNumber)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('passes arguments correctly', async () => {
      vi.mocked(execCliCommand).mockResolvedValue('');
      await lib.deleteProject(owner, projectNumber);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining([owner, projectNumber])
      );
    });
  });

  describe('editItem', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.editItem(projectId, 'item-id', {})).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('requires fieldValue if field supplied', async () => {
      await expect(
        lib.editItem(projectId, 'item-id', { field: 'Status' })
      ).rejects.toThrow(
        'Must supply both field and fieldValue if either is provided'
      );
    });

    it('must use DI_* ID to edit title and body', async () => {
      const itemId = 'PVTI_item-id';
      await expect(
        lib.editItem(projectId, itemId, {
          title: 'New Title',
          body: 'New Body'
        })
      ).rejects.toThrow(
        'Must use draft issue content id to edit title or body'
      );
    });

    it('can edit title and body', async () => {
      const itemId = 'DI_item-id';
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await lib.editItem(projectId, itemId, {
        title: 'New Title',
        body: 'New Body'
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--title', '--body'])
      );
    });

    it('handles project not found error', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql).mockRejectedValue(
        createMockGraphqlResponseError([
          {
            type: 'NOT_FOUND',
            message: '',
            path: ['project']
          }
        ])
      );
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('handles field not found error', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql).mockRejectedValue(
        createMockGraphqlResponseError([
          {
            type: 'NOT_FOUND',
            message: '',
            path: ['project', 'field']
          }
        ])
      );
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.FieldNotFoundError);
    });

    it('throws other graphql errors', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql).mockRejectedValue(error);
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toBe(error);
    });

    it('handles item not found error', async () => {
      const itemId = 'item-id';
      const field = 'Opened';
      const fieldValue = '2023-01-01';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: undefined
        }
      });
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.ItemNotFoundError);
    });

    it('handles field not found error (two)', async () => {
      const itemId = 'item-id';
      const field = 'Opened';
      const fieldValue = '2023-01-01';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: {
            field: null
          }
        }
      });
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.FieldNotFoundError);
    });

    it('can edit date field', async () => {
      const itemId = 'item-id';
      const field = 'Opened';
      const fieldId = 'field-id';
      const fieldValue = '2023-01-01T00:53:48.809Z';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: {
            field: {
              id: fieldId,
              dataType: 'DATE'
            }
          }
        }
      });
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await lib.editItem(projectId, itemId, {
        field,
        fieldValue
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--field-id', fieldId, '--date', '2023-01-01'])
      );
    });

    it('can edit number field', async () => {
      const itemId = 'item-id';
      const field = 'Count';
      const fieldId = 'field-id';
      const fieldValue = '3';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: {
            field: {
              id: fieldId,
              dataType: 'NUMBER'
            }
          }
        }
      });
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await lib.editItem(projectId, itemId, {
        field,
        fieldValue
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--field-id', fieldId, '--number', fieldValue])
      );
    });

    it('can edit text field', async () => {
      const itemId = 'item-id';
      const field = 'Name';
      const fieldId = 'field-id';
      const fieldValue = 'foobar';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: {
            field: {
              id: fieldId,
              dataType: 'TEXT'
            }
          }
        }
      });
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await lib.editItem(projectId, itemId, {
        field,
        fieldValue
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--field-id', fieldId, '--text', fieldValue])
      );
    });

    it('can edit single select field', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldId = 'field-id';
      const fieldValue = 'Done';
      const optionId = 'option-id';
      const mockOctokit = mockGetOctokit();
      vi.mocked(
        mockOctokit.graphql<
          lib.FieldTypeResponse | lib.SingleSelectOptionIdResponse
        >
      )
        .mockResolvedValueOnce({
          projectV2Item: {
            project: {
              field: {
                id: fieldId,
                dataType: 'SINGLE_SELECT'
              }
            }
          }
        })
        .mockResolvedValueOnce({
          projectV2: {
            field: {
              options: [{ id: optionId }]
            }
          }
        });
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await lib.editItem(projectId, itemId, {
        field,
        fieldValue
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining([
          '--field-id',
          fieldId,
          '--single-select-option-id',
          optionId
        ])
      );
    });

    it('handles single select option not found error', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldId = 'field-id';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      vi.mocked(
        mockOctokit.graphql<
          lib.FieldTypeResponse | lib.SingleSelectOptionIdResponse
        >
      )
        .mockResolvedValueOnce({
          projectV2Item: {
            project: {
              field: {
                id: fieldId,
                dataType: 'SINGLE_SELECT'
              }
            }
          }
        })
        .mockResolvedValueOnce({
          projectV2: {
            field: {
              options: []
            }
          }
        });
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.SingleSelectOptionNotFoundError);
    });

    it('handles project not found error (single select)', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldId = 'field-id';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      vi.mocked(
        mockOctokit.graphql<
          lib.FieldTypeResponse | lib.SingleSelectOptionIdResponse
        >
      )
        .mockResolvedValueOnce({
          projectV2Item: {
            project: {
              field: {
                id: fieldId,
                dataType: 'SINGLE_SELECT'
              }
            }
          }
        })
        .mockRejectedValueOnce(
          createMockGraphqlResponseError([
            {
              type: 'NOT_FOUND',
              message: '',
              path: ['projectV2']
            }
          ])
        );
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('handles field not found error (single select)', async () => {
      const itemId = 'item-id';
      const field = 'Status';
      const fieldId = 'field-id';
      const fieldValue = 'Done';
      const mockOctokit = mockGetOctokit();
      vi.mocked(
        mockOctokit.graphql<
          lib.FieldTypeResponse | lib.SingleSelectOptionIdResponse
        >
      )
        .mockResolvedValueOnce({
          projectV2Item: {
            project: {
              field: {
                id: fieldId,
                dataType: 'SINGLE_SELECT'
              }
            }
          }
        })
        .mockRejectedValueOnce(
          createMockGraphqlResponseError([
            {
              type: 'NOT_FOUND',
              message: '',
              path: ['projectV2', 'field']
            }
          ])
        );
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow(lib.FieldNotFoundError);
    });

    it('throws error for unsupported field type', async () => {
      const itemId = 'item-id';
      const field = 'Iteration';
      const fieldId = 'field-id';
      const fieldValue = '3';
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql<lib.FieldTypeResponse>).mockResolvedValue({
        projectV2Item: {
          project: {
            field: {
              id: fieldId,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dataType: 'ITERATION' as any
            }
          }
        }
      });
      await expect(
        lib.editItem(projectId, itemId, {
          field,
          fieldValue
        })
      ).rejects.toThrow('Unsupported field type');
    });

    it('cannot edit field at same time as title and body', async () => {
      const itemId = 'DI_item-id';
      const field = 'Status';
      const fieldValue = 'Done';
      await expect(
        lib.editItem(projectId, itemId, {
          title: 'New Title',
          body: 'New Body',
          field,
          fieldValue
        })
      ).rejects.toThrow('Cannot edit field at same time as title or body');
    });

    it('returns item ID', async () => {
      const itemId = 'item-id';
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: itemId })
      );
      await expect(lib.editItem(projectId, itemId, {})).resolves.toEqual(
        itemId
      );
    });
  });

  describe('editProject', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.editProject(owner, projectNumber, {})).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('can edit everything', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await lib.editProject(owner, projectNumber, {
        description: 'New Description',
        readme: 'New Readme',
        title: 'New Title',
        public: true
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining([
          '--title',
          '--description',
          '--readme',
          '--visibility'
        ])
      );
    });

    it('can set visibility to private', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await lib.editProject(owner, projectNumber, {
        public: false
      });
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--visibility'])
      );
    });

    it('returns project ID', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(lib.editProject(owner, projectNumber, {})).resolves.toEqual(
        projectId
      );
    });
  });

  describe('getItem', () => {
    const itemId = 'PVTI_item-id';

    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.getItem(owner, projectNumber, itemUrl)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('returns null if item not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  items: {
                    nodes: [],
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      await expect(lib.getItem(owner, projectNumber, itemUrl)).resolves.toBe(
        null
      );
    });

    it('can get item without field', async () => {
      const items: lib.ProjectItem[] = [
        {
          id: itemId,
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One',
            url: itemUrl
          },
          type: 'ISSUE'
        }
      ];
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      const { content, type } = items[0];

      await expect(lib.getItem(owner, projectNumber, itemUrl)).resolves.toEqual(
        {
          id: itemId,
          projectId,
          content,
          type
        }
      );
    });

    it('can get item with field', async () => {
      const fieldId = 'field-id';
      const fieldValue = 'Foobar';
      const items: lib.ProjectItemWithFieldValue[] = [
        {
          id: itemId,
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One',
            url: itemUrl
          },
          fieldValueByName: {
            singleSelectValue: fieldValue
          },
          type: 'ISSUE'
        }
      ];
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            return {
              value: {
                projectV2: {
                  field: {
                    id: fieldId
                  },
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      const { content, type } = items[0];

      await expect(
        lib.getItem(owner, projectNumber, itemUrl, 'Name')
      ).resolves.toEqual({
        id: itemId,
        projectId,
        content,
        field: {
          id: fieldId,
          value: fieldValue
        },
        type
      });
    });

    it('handles project not found (two)', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['projectV2']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getItem(owner, projectNumber, itemUrl)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('handles field not found', async () => {
      const items: lib.ProjectItemWithFieldValue[] = [
        {
          id: itemId,
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One',
            url: itemUrl
          },
          fieldValueByName: null,
          type: 'ISSUE'
        }
      ];
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            return {
              value: {
                projectV2: {
                  field: null,
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      await expect(lib.getItem(owner, projectNumber, itemUrl)).rejects.toThrow(
        lib.FieldNotFoundError
      );
    });

    it('handles field not found (two)', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: 'project-id' })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['projectV2', 'field']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getItem(owner, projectNumber, itemUrl)).rejects.toThrow(
        lib.FieldNotFoundError
      );
    });

    it('handles field has no value', async () => {
      const fieldId = 'field-id';
      const items: lib.ProjectItemWithFieldValue[] = [
        {
          id: itemId,
          content: {
            id: 'content-id-one',
            body: 'Body One',
            title: 'Title One',
            url: itemUrl
          },
          fieldValueByName: null,
          type: 'ISSUE'
        }
      ];
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            return {
              value: {
                projectV2: {
                  field: {
                    id: fieldId
                  },
                  items: {
                    nodes: items,
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      const { content, type } = items[0];

      await expect(
        lib.getItem(owner, projectNumber, itemUrl, 'Name')
      ).resolves.toEqual({
        id: itemId,
        projectId,
        content,
        field: {
          id: fieldId,
          value: null
        },
        type
      });
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectItemsWithFieldResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(lib.getItem(owner, projectNumber, itemUrl)).rejects.toBe(
        error
      );
    });
  });

  describe('findProject', () => {
    const project = { id: projectId, title: projectTitle };

    it('handles project not found', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ projects: [project] })
      );
      await expect(
        lib.findProject(owner, 'A Different Title')
      ).resolves.toEqual(null);
    });

    it('can include closed projects', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ projects: [project] })
      );
      await expect(lib.findProject(owner, projectTitle, true)).resolves.toEqual(
        project
      );
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--closed'])
      );
    });

    it('can set a limit', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ projects: [project] })
      );
      await expect(
        lib.findProject(owner, projectTitle, false, '50')
      ).resolves.toEqual(project);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['--limit'])
      );
    });

    it('returns project details', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ projects: [project] })
      );
      await expect(lib.findProject(owner, projectTitle)).resolves.toEqual(
        project
      );
      expect(execCliCommand).not.toHaveBeenCalledWith(
        expect.arrayContaining(['--limit'])
      );
    });
  });

  describe('findWorkflow', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(
        lib.findWorkflow(owner, projectNumber, workflow.name)
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('returns null if workflow not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectWorkflowsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  workflows: {
                    nodes: [],
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });

      await expect(
        lib.findWorkflow(owner, projectNumber, workflow.name)
      ).resolves.toBe(null);
    });

    it('handles project not found (two)', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['projectV2']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectWorkflowsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(
        lib.findWorkflow(owner, projectNumber, workflow.name)
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('returns workflow details', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      let iterateCount = 0;
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectWorkflowsResponse;
          }> {
            return {
              value: {
                projectV2: {
                  workflows: {
                    nodes: [workflow],
                    pageInfo: {
                      endCursor: 'end-cursor',
                      hasNextPage: false
                    }
                  }
                }
              },
              done: iterateCount++ === 1
            };
          }
        })
      });
      await expect(
        lib.findWorkflow(owner, projectNumber, workflow.name)
      ).resolves.toEqual({ ...workflow, projectId });
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql.paginate.iterator).mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          async next(): Promise<{
            done: boolean;
            value: lib.ProjectWorkflowsResponse;
          }> {
            throw error;
          }
        })
      });

      await expect(
        lib.findWorkflow(owner, projectNumber, workflow.name)
      ).rejects.toBe(error);
    });
  });

  describe('getWorkflow', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(
        lib.getWorkflow(owner, projectNumber, workflow.number)
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('returns null if workflow not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      vi.mocked(mockOctokit.graphql).mockResolvedValueOnce({
        projectV2: {
          workflow: null
        }
      });

      await expect(
        lib.getWorkflow(owner, projectNumber, workflow.number)
      ).resolves.toBe(null);
    });

    it('handles project not found (two)', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'NOT_FOUND',
          message: '',
          path: ['projectV2']
        }
      ]);
      vi.mocked(mockOctokit.graphql).mockRejectedValue(error);

      await expect(
        lib.getWorkflow(owner, projectNumber, workflow.number)
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('returns workflow details', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      vi.mocked(mockOctokit.graphql).mockResolvedValueOnce({
        projectV2: {
          workflow
        }
      });
      await expect(
        lib.getWorkflow(owner, projectNumber, workflow.number)
      ).resolves.toEqual({ ...workflow, projectId });
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql).mockRejectedValue(error);

      await expect(
        lib.getWorkflow(owner, projectNumber, workflow.number)
      ).rejects.toBe(error);
    });
  });

  describe('getProject', () => {
    it('handles project not found', async () => {
      mockProjectNotFoundError();
      await expect(lib.getProject(owner, projectNumber)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('returns project details', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({ id: projectId })
      );
      await expect(lib.getProject(owner, projectNumber)).resolves.toEqual({
        id: projectId
      });
    });
  });

  describe('linkProjectToRepository', () => {
    const repository = 'dsanders11/project-actions';
    const repositoryId = 'repository-id';

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('handles repository not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql).mockRejectedValue(
        createMockGraphqlResponseError([
          {
            type: 'NOT_FOUND',
            message: '',
            path: ['']
          }
        ])
      );

      await expect(
        lib.linkProjectToRepository(projectNumber, repository)
      ).rejects.toThrow(lib.RepositoryNotFoundError);
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql).mockRejectedValue(error);

      await expect(
        lib.linkProjectToRepository(projectNumber, repository)
      ).rejects.toBe(error);
    });

    it('handles project not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(
        mockOctokit.graphql<lib.RepositoryIdResponse>
      ).mockResolvedValueOnce({
        repository: {
          id: repositoryId
        }
      });
      mockProjectNotFoundError();

      await expect(
        lib.linkProjectToRepository(projectNumber, repository)
      ).rejects.toThrow(lib.ProjectNotFoundError);
    });

    it('links repository to project', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql)
        .mockResolvedValueOnce({
          repository: {
            id: repositoryId
          }
        })
        .mockResolvedValueOnce({});
      vi.mocked(execCliCommand);

      await expect(
        lib.linkProjectToRepository(projectNumber, repository)
      ).resolves.toEqual(repositoryId);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['link', '--repo'])
      );
    });

    it('unlinks team from project', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql)
        .mockResolvedValueOnce({
          repository: {
            id: repositoryId
          }
        })
        .mockResolvedValueOnce({});
      vi.mocked(execCliCommand);

      await expect(
        lib.linkProjectToRepository(projectNumber, repository, false)
      ).resolves.toEqual(repositoryId);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['unlink', '--repo'])
      );
    });
  });

  describe('linkProjectToTeam', () => {
    const team = 'foo/bar';
    const teamId = 'team-id';

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('handles team not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql).mockRejectedValue(
        createMockGraphqlResponseError([
          {
            type: 'NOT_FOUND',
            message: '',
            path: ['']
          }
        ])
      );

      await expect(lib.linkProjectToTeam(projectNumber, team)).rejects.toThrow(
        lib.TeamNotFoundError
      );

      vi.mocked(mockOctokit.graphql<lib.TeamIdResponse>).mockResolvedValue({
        organization: {
          team: null
        }
      });

      await expect(lib.linkProjectToTeam(projectNumber, team)).rejects.toThrow(
        lib.TeamNotFoundError
      );
    });

    it('throws other graphql errors', async () => {
      const mockOctokit = mockGetOctokit();
      const error = createMockGraphqlResponseError([
        {
          type: 'SOME_ERROR',
          message: '',
          path: ['']
        }
      ]);
      vi.mocked(mockOctokit.graphql).mockRejectedValue(error);

      await expect(lib.linkProjectToTeam(projectNumber, team)).rejects.toBe(
        error
      );
    });

    it('handles project not found', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql).mockResolvedValueOnce({
        organization: {
          team: {
            id: teamId
          }
        }
      });
      mockProjectNotFoundError();

      await expect(lib.linkProjectToTeam(projectNumber, team)).rejects.toThrow(
        lib.ProjectNotFoundError
      );
    });

    it('links team to project', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql)
        .mockResolvedValueOnce({
          organization: {
            team: {
              id: teamId
            }
          }
        })
        .mockResolvedValueOnce({});
      vi.mocked(execCliCommand);

      await expect(lib.linkProjectToTeam(projectNumber, team)).resolves.toEqual(
        teamId
      );
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['link', '--team'])
      );
    });

    it('unlinks team from project', async () => {
      const mockOctokit = mockGetOctokit();
      vi.mocked(mockOctokit.graphql)
        .mockResolvedValueOnce({
          organization: {
            team: {
              id: teamId
            }
          }
        })
        .mockResolvedValueOnce({});
      vi.mocked(execCliCommand);

      await expect(
        lib.linkProjectToTeam(projectNumber, team, false)
      ).resolves.toEqual(teamId);
      expect(execCliCommand).toHaveBeenCalledWith(
        expect.arrayContaining(['unlink', '--team'])
      );
    });
  });

  describe('getPullRequestState', () => {
    const prUrl = 'https://github.com/dsanders11/project-actions/pull/2';

    it('returns PR state', async () => {
      vi.mocked(execCliCommand).mockResolvedValue(
        JSON.stringify({
          state: 'MERGED'
        })
      );

      await expect(lib.getPullRequestState(prUrl)).resolves.toEqual('MERGED');
    });

    it('throws on cli error', async () => {
      const error = 'Error getting PR status';
      vi.mocked(execCliCommand).mockRejectedValue(
        new Error('Error getting PR status')
      );

      await expect(lib.getPullRequestState(prUrl)).rejects.toThrow(error);
    });
  });
});
