import { sql } from 'drizzle-orm';
import {
    bigserial,
    check,
    index,
    jsonb,
    pgTable,
    primaryKey,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';

// The client's own thread id (assistant-ui's local id), so the id useChat
// sends is the same before and after a reload. user_id is the portal principal
// the proxy forwards as X-Chat-User.
export const chatThread = pgTable(
    'chat_thread',
    {
        id: text('id').primaryKey(),
        userId: text('user_id').notNull(),
        title: text('title'),
        status: text('status', { enum: ['regular', 'archived'] })
            .notNull()
            .default('regular'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    t => [
        index('chat_thread_user_updated_idx').on(t.userId, t.updatedAt.desc()),
        check(
            'chat_thread_status_check',
            sql`${t.status} in ('regular', 'archived')`
        ),
    ]
);

// Messages form a tree through parent_id, so edits and regenerations are kept
// as branches. `content` is the AI SDK UIMessage without its id — exactly what
// assistant-ui's `ai-sdk/v6` format adapter encodes and decodes. `seq` records
// creation order, which the client relies on to put the newest branch last.
export const chatMessage = pgTable(
    'chat_message',
    {
        threadId: text('thread_id')
            .notNull()
            .references(() => chatThread.id, { onDelete: 'cascade' }),
        id: text('id').notNull(),
        parentId: text('parent_id'),
        format: text('format').notNull(),
        content: jsonb('content')
            .$type<Record<string, unknown>>()
            .notNull(),
        seq: bigserial('seq', { mode: 'number' }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    t => [
        primaryKey({ columns: [t.threadId, t.id] }),
        index('chat_message_thread_seq_idx').on(t.threadId, t.seq),
    ]
);
