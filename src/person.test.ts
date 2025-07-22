import { it as eIt, expect } from "@effect/vitest";
import { Effect, Schema, Struct } from "effect";
import { PgContainer } from "./pg-container";
import { SqlClient, SqlSchema } from "@effect/sql";

eIt.layer(PgContainer.Live, { timeout: "30 seconds" })("Manager", (it) => {
  it.effect(
    "should create a person",
    Effect.fnUntraced(function* () {
      class Person extends Schema.Class<Person>("Person")({
        id: Schema.Number,
        name: Schema.String,
        createdAt: Schema.DateFromSelf,
        updatedAt: Schema.DateFromSelf,
      }) {}

      const InsertPersonSchema = Schema.Struct(
        Struct.omit(Person.fields, "id", "createdAt", "updatedAt")
      );

      const sql = yield* SqlClient.SqlClient;

      const createPerson = { name: "Person" };

      const create = SqlSchema.single({
        Result: Person,
        Request: InsertPersonSchema,
        execute: (request) => sql`
        INSERT INTO
          persons ${sql.insert(request)}
          --                      ^? { readonly name: string; }
        RETURNING
          *
      `,
      });

      const findAll = SqlSchema.findAll({
        Result: Person,
        Request: Schema.Void,
        execute: () => sql`
              SELECT
                *
              FROM
                persons
            `,
      });

      const newPerson = yield* create(createPerson);
      expect(newPerson).toBeDefined();

      const allPersons = yield* findAll();
      expect(allPersons).toContainEqual(newPerson);
    })
  );

  it.effect(
    "should create a person with items",
    Effect.fnUntraced(function* () {
      class PersonWithItems extends Schema.Class<PersonWithItems>(
        "PersonWithItems"
      )({
        id: Schema.Number,
        name: Schema.String,
        items: Schema.Array(Schema.String),
        createdAt: Schema.DateFromSelf,
        updatedAt: Schema.DateFromSelf,
      }) {}
      const InsertPersonWithItemsSchema = Schema.Struct(
        Struct.omit(PersonWithItems.fields, "id", "createdAt", "updatedAt")
      );

      const sql = yield* SqlClient.SqlClient;

      const createPerson = {
        name: "Person with Items",
        items: ["item1", "item2"],
      };

      const create = SqlSchema.single({
        Result: PersonWithItems,
        Request: InsertPersonWithItemsSchema,
        execute: (request) => sql`
        INSERT INTO
          persons_with_items ${sql.insert(request)}
          --                                 ^? { readonly name: string; readonly items: readonly string[]; }

        RETURNING
          *
      `,
      });

      const findAll = SqlSchema.findAll({
        Result: PersonWithItems,
        Request: Schema.Void,
        execute: () => sql`
        SELECT
          *
        FROM
          persons_with_items
      `,
      });

      const newPerson = yield* create(createPerson);
      expect(newPerson).toBeDefined();
      expect(newPerson.items).toEqual(createPerson.items);

      const allPersons = yield* findAll();
      expect(allPersons).toContainEqual(newPerson);
      expect(allPersons.at(0)?.items).toEqual(createPerson.items);
    })
  );

  it.effect(
    "should create a person with stringified items",
    Effect.fnUntraced(function* () {
      class PersonWithStrItems extends Schema.Class<PersonWithStrItems>(
        "PersonWithStrItems"
      )({
        id: Schema.Number,
        name: Schema.String,
        items: Schema.split(";"),
        createdAt: Schema.DateFromSelf,
        updatedAt: Schema.DateFromSelf,
      }) {}
      const InsertPersonWithStrItemsSchema = Schema.Struct(
        Struct.omit(PersonWithStrItems.fields, "id", "createdAt", "updatedAt")
      );

      const sql = yield* SqlClient.SqlClient;

      const createPerson = {
        name: "Person with String Items",
        items: ["item1", "item2"],
      };

      const create = SqlSchema.single({
        Result: PersonWithStrItems,
        Request: InsertPersonWithStrItemsSchema,
        execute: (request) => sql`
        INSERT INTO
          persons_with_str_items ${sql.insert(request)}
          --                                     ^? { readonly name: string; readonly items: string; }
        RETURNING
          *
      `,
      });

      const findAll = SqlSchema.findAll({
        Result: PersonWithStrItems,
        Request: Schema.Void,
        execute: () => sql`
        SELECT
          *
        FROM
          persons_with_str_items
      `,
      });

      const newPerson = yield* create(createPerson);
      expect(newPerson).toBeDefined();
      expect(newPerson.items).toEqual(createPerson.items);

      const allPersons = yield* findAll();
      expect(allPersons).toContainEqual(newPerson);
      expect(allPersons.at(0)?.items).toEqual(createPerson.items);
    })
  );
});
