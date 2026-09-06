import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const nodes = pgTable("nodes", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),

  type: text(),
  title: text(),
  description: text(),
  metadata: jsonb(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const nodeRelation = pgTable(
  "nodeRelation",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    from_id: text("id").default(crypto.randomUUID()).references(() => nodes.id, { onDelete: "cascade" }),
    type: text(),
    provenance: text()
  },
);

export const problems = pgTable(
  "problems",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),


    statement: text(),
    solution: text(), // create the node relation for this because step is more important
    difficulty: integer(),
    concepts: text().array(),
    techniques: text().array(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

