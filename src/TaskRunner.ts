/**
 * Copyright (c) 2017-present, heineiuo.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Task } from './Task'

export interface TaskRunner {
  task: Task
  logs: string[]
  run: () => Promise<void>
  verify?: () => Promise<void | never> | void | never
}
