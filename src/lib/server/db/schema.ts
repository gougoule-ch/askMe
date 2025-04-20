import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	role: text('role').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
