/**
 * @since 1.0.0
 */
import type * as Context from "effect/Context"
import type * as Duration from "effect/Duration"
import type * as Effect from "effect/Effect"
import type * as Fiber from "effect/Fiber"
import type * as Layer from "effect/Layer"
import type * as Pool from "effect/Pool"
import type * as Queue from "effect/Queue"
import type * as Scope from "effect/Scope"
import type * as Stream from "effect/Stream"
import * as internal from "./internal/worker.js"
import type { WorkerError } from "./WorkerError.js"

/**
 * @since 1.0.0
 * @category models
 */
export interface BackingWorker<I, O> {
  readonly fiber: Fiber.Fiber<WorkerError, never>
  readonly send: (message: I, transfers?: ReadonlyArray<unknown>) => Effect.Effect<never, WorkerError, void>
  readonly queue: Queue.Dequeue<BackingWorker.Message<O>>
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace BackingWorker {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Message<O> = readonly [ready: 0] | readonly [data: 1, O]
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const PlatformWorkerTypeId: unique symbol = internal.PlatformWorkerTypeId

/**
 * @since 1.0.0
 * @category type ids
 */
export type PlatformWorkerTypeId = typeof PlatformWorkerTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface PlatformWorker {
  readonly [PlatformWorkerTypeId]: PlatformWorkerTypeId
  readonly spawn: <I, O>(worker: unknown) => Effect.Effect<Scope.Scope, WorkerError, BackingWorker<I, O>>
}

/**
 * @since 1.0.0
 * @category tags
 */
export const PlatformWorker: Context.Tag<PlatformWorker, PlatformWorker> = internal.PlatformWorker

/**
 * @since 1.0.0
 * @category models
 */
export interface Worker<I, E, O> {
  readonly id: number
  readonly join: Effect.Effect<never, WorkerError, never>
  readonly execute: (message: I) => Stream.Stream<never, E | WorkerError, O>
  readonly executeEffect: (message: I) => Effect.Effect<never, E | WorkerError, O>
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Worker {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface Options<I, W = unknown> {
    readonly spawn: (id: number) => W
    readonly encode?: (message: I) => unknown
    readonly transfers?: (message: I) => ReadonlyArray<unknown>
    readonly permits?: number
    readonly queue?: WorkerQueue<I>
  }

  /**
   * @since 1.0.0
   * @category models
   */
  export type Request<I = unknown> = readonly [id: number, data: 0, I] | readonly [id: number, interrupt: 1]

  /**
   * @since 1.0.0
   * @category models
   */
  export type Response<E, O = unknown> =
    | readonly [id: number, data: 0, O]
    | readonly [id: number, end: 1]
    | readonly [id: number, end: 1, O]
    | readonly [id: number, error: 2, E]
    | readonly [id: number, defect: 3, unknown]
}

/**
 * @since 1.0.0
 * @category models
 */
export interface WorkerPool<I, E, O> {
  readonly backing: Pool.Pool<WorkerError, Worker<I, E, O>>
  readonly broadcast: (message: I) => Effect.Effect<never, E | WorkerError, void>
  readonly execute: (message: I) => Stream.Stream<never, E | WorkerError, O>
  readonly executeEffect: (message: I) => Effect.Effect<never, E | WorkerError, O>
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace WorkerPool {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Options<I, W = unknown> =
    & Worker.Options<I, W>
    & ({
      readonly onCreate?: (worker: Worker<I, unknown, unknown>) => Effect.Effect<never, WorkerError, void>
      readonly size: number
    } | {
      readonly onCreate?: (worker: Worker<I, unknown, unknown>) => Effect.Effect<never, WorkerError, void>
      readonly minSize: number
      readonly maxSize: number
      readonly timeToLive: Duration.DurationInput
    })
}

/**
 * @category models
 * @since 1.0.0
 */
export interface WorkerQueue<I> {
  readonly offer: (id: number, item: I) => Effect.Effect<never, never, void>
  readonly take: Effect.Effect<never, never, readonly [id: number, item: I]>
  readonly shutdown: Effect.Effect<never, never, void>
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const WorkerManagerTypeId: unique symbol = internal.WorkerManagerTypeId

/**
 * @since 1.0.0
 * @category type ids
 */
export type WorkerManagerTypeId = typeof WorkerManagerTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface WorkerManager {
  readonly [WorkerManagerTypeId]: WorkerManagerTypeId
  readonly spawn: <I, E, O>(
    options: Worker.Options<I>
  ) => Effect.Effect<Scope.Scope, WorkerError, Worker<I, E, O>>
}

/**
 * @since 1.0.0
 * @category tags
 */
export const WorkerManager: Context.Tag<WorkerManager, WorkerManager> = internal.WorkerManager

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeManager: Effect.Effect<PlatformWorker, never, WorkerManager> = internal.makeManager

/**
 * @since 1.0.0
 * @category layers
 */
export const layerManager: Layer.Layer<PlatformWorker, never, WorkerManager> = internal.layerManager

/**
 * @since 1.0.0
 * @category constructors
 */
export const makePool: <W>() => <I, E, O>(
  options: WorkerPool.Options<I, W>
) => Effect.Effect<WorkerManager | Scope.Scope, never, WorkerPool<I, E, O>> = internal.makePool

/**
 * @since 1.0.0
 * @category constructors
 */
export const makePoolLayer: <W>(
  managerLayer: Layer.Layer<never, never, WorkerManager>
) => <Tag, I, E, O>(
  tag: Context.Tag<Tag, WorkerPool<I, E, O>>,
  options: WorkerPool.Options<I, W>
) => Layer.Layer<never, never, Tag> = internal.makePoolLayer
