import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const repositories = pgTable("repositories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublic: text("is_public").default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const repositoryVersions = pgTable("repository_versions", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  versionTag: text("version_tag").notNull(),
  changelog: text("changelog"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
