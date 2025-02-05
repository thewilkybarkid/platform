import { WorkerError } from "@effect/platform/WorkerError"
import * as Runner from "@effect/platform/WorkerRunner"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Queue from "effect/Queue"
import type * as Scope from "effect/Scope"
import type * as Stream from "effect/Stream"

declare const self: Worker

const platformRunnerImpl = Runner.PlatformRunner.of({
  [Runner.PlatformRunnerTypeId]: Runner.PlatformRunnerTypeId,
  start<I, O>() {
    return Effect.gen(function*(_) {
      if (!("postMessage" in self)) {
        return yield* _(Effect.die("not in a worker"))
      }
      const port = self
      const queue = yield* _(Queue.unbounded<I>())
      const fiber = yield* _(
        Effect.async<never, WorkerError, never>((resume) => {
          function onMessage(event: MessageEvent) {
            const message = (event as MessageEvent).data as Runner.BackingRunner.Message<I>
            if (message[0] === 0) {
              queue.unsafeOffer(message[1])
            } else {
              Effect.runFork(Queue.shutdown(queue))
            }
          }
          function onError(error: ErrorEvent) {
            resume(Effect.fail(WorkerError("unknown", error.message, error.error?.stack)))
          }
          port.addEventListener("message", onMessage)
          port.addEventListener("error", onError)
          return Effect.sync(() => {
            port.removeEventListener("message", onMessage)
            port.removeEventListener("error", onError)
          })
        }),
        Effect.forkScoped
      )
      const send = (message: O, transfer?: ReadonlyArray<unknown>) =>
        Effect.sync(() =>
          port.postMessage([1, message], {
            transfer: transfer as any
          })
        )
      // ready
      port.postMessage([0])
      return { fiber, queue, send }
    })
  }
})

/** @internal */
export const layer = Layer.succeed(Runner.PlatformRunner, platformRunnerImpl)

/** @internal */
export const make = <I, R, E, O>(
  process: (request: I) => Stream.Stream<R, E, O>,
  options?: Runner.Runner.Options<O>
): Effect.Effect<Scope.Scope | R, WorkerError, never> => Effect.provide(Runner.make(process, options), layer)
