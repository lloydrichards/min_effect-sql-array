# Effect SQL Array Column

## Type Bug Report: @effect/sql String Array Incompatibility

This repository demonstrates a type compatibility issue in `@effect/sql` version
0.43.0 where the `sql.insert()` method does not properly handle
`readonly string[]` types as primitive values.

### Bug Description

When using `Schema.Array(Schema.String)` in an Effect Schema class and
attempting to insert records using `sql.insert()`, TypeScript reports a type
error:

```typescript
error TS2769: No overload matches this call.
Argument of type '{ readonly name: string; readonly items: readonly string[]; }' is not assignable to parameter of type 'Record<string, Primitive | Fragment | undefined>'.
Property 'items' is incompatible with index signature.
Type 'readonly string[]' is not assignable to type 'Primitive | Fragment | undefined'.
```

### Environment

- **@effect/sql**: 0.43.0
- **effect**: 3.17.0
- **TypeScript**: 5.x

### Reproduction Steps

1. **Clone and Setup:**

   ```bash
   git clone <repository-url>
   cd min_effect-sql-array
   bun install
   ```

2. **Run Tests (They Pass Despite Type Error):**

   ```bash
   bun run test
   ```

   Output should show:

   ```text
   ✓ src/person.test.ts (3 tests) 4556ms
     ✓ SQL Array Column > should create a person 8ms
     ✓ SQL Array Column > should create a person with items 5ms
     ✓ SQL Array Column > should create a person with stringified items 4ms
   ```

3. **Reveal the Type Error:**

   ```bash
   bun lint
   ```

   Output should show:

   ```text
   src/person.test.ts:84:43 - error TS2769: No overload matches this call.
   Overload 1 of 2, '(value: readonly Record<string, Primitive | Fragment | undefined>[]): RecordInsertHelper', gave the following error.
    Argument of type '{ readonly name: string; readonly items: readonly string[]; }' is not assignable to parameter of type 'readonly Record<string, Primitive | Fragment | undefined>[]'.
      Type '{ readonly name: string; readonly items: readonly string[]; }' is missing the following properties from type 'readonly Record<string, Primitive | Fragment | undefined>[]': length, concat, join, slice, and 26 more.
   Overload 2 of 2, '(value: Record<string, Primitive | Fragment | undefined>): RecordInsertHelper', gave the following error.
    Argument of type '{ readonly name: string; readonly items: readonly string[]; }' is not assignable to parameter of type 'Record<string, Primitive | Fragment | undefined>'.
      Property 'items' is incompatible with index signature.
        Type 'readonly string[]' is not assignable to type 'Primitive | Fragment | undefined'.
          Type 'readonly string[]' is missing the following properties from type 'Uint8Array<ArrayBufferLike>': BYTES_PER_ELEMENT, buffer, byteLength, byteOffset, and 11 more.

    84 persons_with_items ${sql.insert(request)}
   ```

### Code Example

The problematic code is in `src/person.test.ts`:

```typescript
class PersonWithItems extends Schema.Class<PersonWithItems>("PersonWithItems")({
  id: Schema.Number,
  name: Schema.String,
  items: Schema.Array(Schema.String), // This creates readonly string[]
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
}) {}

const create = SqlSchema.single({
  Result: PersonWithItems,
  Request: InsertPersonWithItemsSchema,
  execute: (request) => sql`
 INSERT INTO
   persons_with_items ${sql.insert(request)}  // ← Type error here
   --                                 ^? { readonly name: string; readonly items: readonly string[]; }
 RETURNING *
`,
});
```

The type annotation comment shows that `request` has type
`{ readonly name: string; readonly items: readonly string[]; }`, but
`sql.insert()` expects `readonly string[]` to be assignable to
`Primitive | Fragment | undefined`, which it is not.

### Database Schema

The PostgreSQL table is correctly defined to handle text arrays:

```sql
CREATE TABLE persons_with_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',  -- PostgreSQL text array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Current Behavior

- **Runtime**: The code works correctly at runtime and all tests pass
- **Database**: PostgreSQL properly handles the string array insertion
- **TypeScript**: Compilation fails with strict type checking
