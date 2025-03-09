// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* eslint-disable @typescript-eslint/no-explicit-any, vitest/expect-expect */
import { describe, expect, test } from 'vitest';

import { callAsyncFunction } from '../../src/github-script/async-function.js';

describe('callAsyncFunction', () => {
  test('calls the function with its arguments', async () => {
    const result = await callAsyncFunction({ foo: 'bar' } as any, 'return foo');
    expect(result).toEqual('bar');
  });

  test('throws on ReferenceError', async () => {
    expect.assertions(1);

    await expect(async () =>
      callAsyncFunction({} as any, 'proces')
    ).rejects.toThrow(ReferenceError);
  });

  test('can access process', async () => {
    await callAsyncFunction({} as any, 'process');
  });

  test('can access console', async () => {
    await callAsyncFunction({} as any, 'console');
  });
});
