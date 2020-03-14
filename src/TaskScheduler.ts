/**
 * Copyright (c) 2017-present, heineiuo.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TaskRunner } from './TaskRunner'
import { Task, TaskStatus } from './Task'

export class TaskScheduler {
  static onError(e: Error): void | Promise<void> {
    console.log(`[${new Date()}] TaskSchedulerLoopError`, e)
  }

  constructor(options: {
    debug?: boolean
    waitGap?: number
    maxRunners?: number
    onError?: (e: Error) => Promise<void> | void
    createRunner: (task: Task) => TaskRunner | void | Promise<TaskRunner | void>
    createTaskIterator: () => AsyncIterableIterator<Task>
  }) {
    this.runners = new Map()
    this.debug = options.debug || false
    this.maxRunners = options.maxRunners || 10
    this.waitGap = options.waitGap || 5000
    this.createRunner = options.createRunner
    this.createTaskIterator = options.createTaskIterator
    this.onError = options.onError || TaskScheduler.onError
  }

  private debug: boolean
  private onError: (e: Error) => Promise<void> | void
  private maxRunners = 10
  private waitGap = 5000
  private createTaskIterator: () => AsyncIterableIterator<Task>
  private createRunner: (
    task: Task
  ) => TaskRunner | void | Promise<TaskRunner | void>
  private looping = false
  private loopTimer!: NodeJS.Timeout
  private runners: Map<string, TaskRunner>

  stop = (): void => {
    clearInterval(this.loopTimer)
    delete this.loopTimer
  }

  start = (): void => {
    if (this.loopTimer) {
      this.stop()
    }
    this.loopTimer = setInterval(this.loop, this.waitGap)
  }

  get = (taskId: string): TaskRunner | void => {
    if (this.runners.has(taskId)) return this.runners.get(taskId)
  }

  loop = async (): Promise<void> => {
    try {
      // 检查上个loop是否在执行，在则loop结束
      if (this.looping) {
        if (this.debug) {
          console.log('skip because looping')
        }
        return
      }
      this.looping = true

      // clear finished or failed runner
      for (const runnerState of this.runners) {
        if (
          runnerState[1].task.status === TaskStatus.success ||
          runnerState[1].task.status === TaskStatus.failed
        ) {
          this.runners.delete(runnerState[0])
        }
      }

      if (this.runners.size >= this.maxRunners) {
        if (this.debug) {
          console.log('skip because runners size too big')
        }
        return
      }

      for await (const task of this.createTaskIterator()) {
        if (this.runners.has(task.ID)) {
          if (this.debug) {
            console.log('skip because task exist')
          }
          continue
        }

        if (task.once && task.status === TaskStatus.success) {
          if (this.debug) {
            console.log('skip because task is once and has been success')
          }
          continue
        }

        if (task.last + task.every > Date.now() + this.waitGap) {
          if (this.debug) {
            console.log('skip because task do not need to run now')
          }
          continue
        }

        const runner = await this.createRunner(task)
        if (runner) {
          const waitTime = (Date.now() - task.last) % task.every
          this.runners.set(task.ID, runner)
          this.delayRun(runner, waitTime)
          task.status = TaskStatus.pending
          task.last = Date.now() + waitTime
        } else {
          this.onError(new Error('No runner matched'))
        }
        if (this.runners.size >= this.maxRunners) {
          break
        }
      }
    } catch (e) {
      this.onError(e)
    } finally {
      this.looping = false
    }
  }

  delayRun(runner: TaskRunner, waitTime: number): void {
    setTimeout(async () => {
      try {
        await runner.run()
        runner.task.status = TaskStatus.success
        runner.task.last = Date.now()
      } catch (e) {
        this.onError(e)
        runner.task.status = TaskStatus.failed
      } finally {
        try {
          await runner.task.save()
        } catch (e) {}
        this.runners.delete(runner.task.ID)
      }
    }, waitTime)
  }
}
