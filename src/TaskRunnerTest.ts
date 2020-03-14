/**
 * Copyright (c) 2017-present, heineiuo.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Task, TaskStatus } from './Task'
import { TaskRunner } from './TaskRunner'

interface TestArgs {
  orgName: string
  projectName: string
  count: number
}

export class TaskRunnerTest implements TaskRunner {
  constructor(task: Task) {
    this.logs = []
    this.task = task as Task<TestArgs>
  }

  logs: string[]
  task: Task<TestArgs>

  run = async (): Promise<void> => {
    try {
      const list = new Array(100).fill(0)
      for await (const i of list) {
        await new Promise(resolve =>
          setTimeout(resolve, i + 1000 * Math.random())
        )
        this.task.log += Buffer.alloc(300).toString()
        await this.task.save()
      }
    } catch (e) {
    } finally {
      try {
        this.task.status = TaskStatus.success
        await this.task.save()
      } catch (e) {}
    }
  }
}
