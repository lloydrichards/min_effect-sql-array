import { BunContext } from "@effect/platform-bun";
import { SqlClient } from "@effect/sql";
import { PgClient } from "@effect/sql-pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Effect, Layer, Redacted, String } from "effect";

export class PgContainer extends Effect.Service<PgContainer>()("PgContainer", {
  scoped: Effect.acquireRelease(
    Effect.promise(() => new PostgreSqlContainer("postgres:alpine").start()),
    (container) => Effect.promise(() => container.stop())
  ),
}) {
  static readonly Live = Layer.effectDiscard(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      yield* sql`
        CREATE TABLE IF NOT EXISTS persons (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      yield* sql`
        CREATE TABLE IF NOT EXISTS persons_with_items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          items TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      yield* sql`
        CREATE TABLE IF NOT EXISTS persons_with_str_items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          items TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
    })
  ).pipe(
    Layer.provideMerge(
      Layer.unwrapEffect(
        Effect.gen(function* () {
          const container = yield* PgContainer;
          return PgClient.layer({
            url: Redacted.make(container.getConnectionUri()),
            transformQueryNames: String.camelToSnake,
            transformResultNames: String.snakeToCamel,
          });
        })
      )
    ),
    Layer.provide(PgContainer.Default),
    Layer.provide(BunContext.layer),
    Layer.orDie
  );
}
