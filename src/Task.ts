/**
 * Copyright (c) 2018-present, heineiuo.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TaskStatus {
  none,
  pending,
  success,
  failed,
}

export interface Task<Arg = unknown> {
  ID: string
  once: boolean
  type: string
  arg?: Arg
  log: string
  last: number
  every: number
  status: TaskStatus
  save(): Promise<void> | void
}
