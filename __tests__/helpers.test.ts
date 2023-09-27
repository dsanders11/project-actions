import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { Octokit } from '@octokit/core';

import * as helpers from '../src/helpers';
import { mockGetInput, overridePlatform, resetPlatform } from './utils';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/tool-cache');
jest.mock('@octokit/core', () => ({
  Octokit: {
    plugin: jest.fn()
  }
}));
jest.mock('@octokit/plugin-paginate-graphql');

describe('helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('installGhCli', () => {
    beforeEach(() => {
      overridePlatform('linux');
    });

    afterEach(() => {
      resetPlatform();
    });

    it('throws an error on non-Linux platforms', async () => {
      overridePlatform('win32');
      await expect(helpers.installGhCli()).rejects.toThrow(
        'Only Linux runners have support at the moment'
      );
    });

    it('checks cache for gh', async () => {
      jest.mocked(tc.find).mockReturnValue('/path/to/tool/');
      await expect(helpers.installGhCli()).resolves.toEqual(
        '/path/to/tool/bin/gh'
      );
      expect(tc.find).toHaveBeenCalledWith('gh', expect.anything());
    });

    it('downloads and caches gh', async () => {
      jest.mocked(tc.find).mockReturnValue('');
      jest
        .mocked(tc.downloadTool)
        .mockResolvedValue('/path/to/download.tar.gz');
      jest.mocked(tc.extractTar).mockResolvedValue('/path/to/extracted/');
      jest.mocked(tc.cacheDir).mockResolvedValue('/path/to/cached/');
      await expect(helpers.installGhCli()).resolves.toEqual(
        '/path/to/cached/bin/gh'
      );
      expect(tc.find).toHaveBeenCalledWith('gh', expect.anything());
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractTar).toHaveBeenCalledWith(
        '/path/to/download.tar.gz',
        undefined,
        expect.anything()
      );
      expect(tc.cacheDir).toHaveBeenCalledWith(
        '/path/to/extracted/',
        'gh',
        expect.anything()
      );
    });
  });

  describe('execCliCommand', () => {
    beforeEach(() => {
      overridePlatform('linux');
    });

    afterEach(() => {
      resetPlatform();
    });

    it('requires the token input', async () => {
      mockGetInput({});
      await expect(helpers.execCliCommand).rejects.toThrow(
        'Input required and not supplied: token'
      );
    });

    it('sets GH_TOKEN', async () => {
      const args = ['project', 'view'];
      const stdout = 'output';
      const token = 'gh-token';
      mockGetInput({ token });
      jest
        .mocked(exec.getExecOutput)
        .mockResolvedValue({ exitCode: 0, stdout, stderr: '' });
      await expect(helpers.execCliCommand(args)).resolves.toEqual(stdout);
      expect(exec.getExecOutput).toHaveBeenCalledWith(
        expect.anything(),
        args,
        expect.objectContaining({
          env: {
            GH_TOKEN: token
          }
        })
      );
    });

    it('throws error on non-zero exit code', async () => {
      const args = ['project', 'view'];
      const stdout = 'output';
      const stderr = 'my error';
      const token = 'gh-token';
      mockGetInput({ token });
      jest
        .mocked(exec.getExecOutput)
        .mockResolvedValue({ exitCode: 1, stdout, stderr });
      await expect(helpers.execCliCommand(args)).rejects.toThrow(stderr);
    });

    it('throws error on zero exit code if stderr with no stdout', async () => {
      const args = ['project', 'view'];
      const stdout = '';
      const stderr = 'my error';
      const token = 'gh-token';
      mockGetInput({ token });
      jest
        .mocked(exec.getExecOutput)
        .mockResolvedValue({ exitCode: 0, stdout, stderr });
      await expect(helpers.execCliCommand(args)).rejects.toThrow(stderr);
    });
  });

  describe('getOctokit', () => {
    it('requires the token input', () => {
      mockGetInput({});
      expect(helpers.getOctokit).toThrow(
        'Input required and not supplied: token'
      );
    });

    it('uses the auth token', () => {
      const token = 'auth-token';
      mockGetInput({ token });

      const mockOctokit = jest.fn();

      (Octokit.plugin as jest.Mock).mockReturnValue(mockOctokit);

      helpers.getOctokit();
      expect(mockOctokit).toHaveBeenCalledWith({ auth: token });
    });
  });
});
