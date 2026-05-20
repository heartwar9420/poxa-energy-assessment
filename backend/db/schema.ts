import { pgTable, uuid, varchar, timestamp, numeric, index } from 'drizzle-orm/pg-core';

export const telemetry = pgTable(
  'telemetry',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: varchar('device_id', { length: 50 }).notNull(),
    attribute: varchar('attribute', { length: 50 }).notNull(),
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => [index('telemetry_search_idx').on(table.deviceId, table.attribute, table.timestamp)],
);

export const dashboards = pgTable('dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const charts = pgTable('charts', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  attribute: varchar('attribute', { length: 255 }).notNull(),
  dashboardId: uuid('dashboard_id')
    .notNull()
    .references(() => dashboards.id, { onDelete: 'cascade' }),
});
