import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { UIMessage } from 'ai';
import { db } from './db/client.js';
import { chatMessage, chatThread } from './db/schema.js';

// assistant-ui's name for a UIMessage stored without its id; the client's
// history adapter only decodes rows in this format.
export const MESSAGE_FORMAT = 'ai-sdk/v6';

export type ThreadStatus = 'regular' | 'archived';

export interface ThreadMetadata {
    remoteId: string;
    status: ThreadStatus;
    title?: string;
}

export interface StoredMessage {
    id: string;
    parent_id: string | null;
    format: string;
    content: Record<string, unknown>;
}

// A thread that is missing and one owned by someone else are the same answer,
// so a caller can't probe for other users' thread ids.
export class ThreadNotFoundError extends Error {
    constructor(threadId: string) {
        super(`thread ${threadId} not found`);
    }
}

function toMetadata(row: typeof chatThread.$inferSelect): ThreadMetadata {
    return {
        remoteId: row.id,
        status: row.status,
        ...(row.title ? { title: row.title } : {}),
    };
}

function owned(userId: string, threadId: string) {
    return and(eq(chatThread.id, threadId), eq(chatThread.userId, userId));
}

export async function listThreads(userId: string): Promise<ThreadMetadata[]> {
    const rows = await db
        .select()
        .from(chatThread)
        .where(eq(chatThread.userId, userId))
        .orderBy(desc(chatThread.updatedAt));
    return rows.map(toMetadata);
}

export async function getThread(
    userId: string,
    threadId: string
): Promise<ThreadMetadata | undefined> {
    const [row] = await db
        .select()
        .from(chatThread)
        .where(owned(userId, threadId));
    return row && toMetadata(row);
}

// Creates the thread, or marks activity on it if it is the user's: one
// statement, since it runs before every chat message. Idempotent, as the
// client's initialize call and its first chat message race, and either may
// arrive first. Someone else's thread updates no row and so returns none.
export async function ensureThread(
    userId: string,
    threadId: string
): Promise<void> {
    const rows = await db
        .insert(chatThread)
        .values({ id: threadId, userId })
        .onConflictDoUpdate({
            target: chatThread.id,
            set: { updatedAt: sql`now()` },
            setWhere: eq(chatThread.userId, userId),
        })
        .returning({ id: chatThread.id });
    if (!rows.length) throw new ThreadNotFoundError(threadId);
}

// Leaves updated_at alone: the list is ordered by last activity, and renaming
// or archiving a chat isn't activity.
export async function updateThread(
    userId: string,
    threadId: string,
    changes: { title?: string; status?: ThreadStatus }
): Promise<boolean> {
    const rows = await db
        .update(chatThread)
        .set(changes)
        .where(owned(userId, threadId))
        .returning({ id: chatThread.id });
    return rows.length > 0;
}

export async function deleteThread(
    userId: string,
    threadId: string
): Promise<boolean> {
    const rows = await db
        .delete(chatThread)
        .where(owned(userId, threadId))
        .returning({ id: chatThread.id });
    return rows.length > 0;
}

// Callers check ownership first. A message that already exists keeps its
// parent and its place in the order: only its content changes, which is how a
// reply continued after a client-side tool call is saved in place.
export async function upsertMessage(
    threadId: string,
    message: UIMessage,
    parentId: string | null
): Promise<void> {
    const { id, ...content } = message;
    await db
        .insert(chatMessage)
        .values({
            threadId,
            id,
            parentId,
            format: MESSAGE_FORMAT,
            content,
        })
        .onConflictDoUpdate({
            target: [chatMessage.threadId, chatMessage.id],
            set: { content },
        });
}

// Creation order, which the client relies on: with no explicit head, it shows
// the branch ending at the last message it is given.
export async function listMessages(
    userId: string,
    threadId: string
): Promise<StoredMessage[] | undefined> {
    if (!(await getThread(userId, threadId))) return undefined;
    const rows = await db
        .select()
        .from(chatMessage)
        .where(eq(chatMessage.threadId, threadId))
        .orderBy(asc(chatMessage.seq));
    return rows.map(row => ({
        id: row.id,
        parent_id: row.parentId,
        format: row.format,
        content: row.content,
    }));
}

// The message and everything that branches off it, so nothing is left
// pointing at a parent that no longer exists.
export async function deleteMessage(
    userId: string,
    threadId: string,
    messageId: string
): Promise<boolean> {
    if (!(await getThread(userId, threadId))) return false;
    const result = await db.execute(sql`
        with recursive subtree as (
            select id from ${chatMessage}
            where thread_id = ${threadId} and id = ${messageId}
            union
            select child.id from ${chatMessage} child
            join subtree on child.parent_id = subtree.id
            where child.thread_id = ${threadId}
        )
        delete from ${chatMessage}
        where thread_id = ${threadId} and id in (select id from subtree)
    `);
    return (result.rowCount ?? 0) > 0;
}

// The conversation as the model should see it: the leaf and its ancestors,
// oldest first. Callers check ownership first. Parent ids come from the
// client, so the walk stops where a parent link loops back on the branch
// rather than going round it.
export async function loadBranch(
    threadId: string,
    leafId: string
): Promise<UIMessage[]> {
    const result = await db.execute<{
        id: string;
        content: Record<string, unknown>;
    }>(sql`
        with recursive branch as (
            select id, parent_id, content, 0 as depth from ${chatMessage}
            where thread_id = ${threadId} and id = ${leafId}
            union all
            select parent.id, parent.parent_id, parent.content, branch.depth + 1
            from ${chatMessage} parent
            join branch on parent.id = branch.parent_id
            where parent.thread_id = ${threadId}
        ) cycle id set is_cycle using path
        select id, content from branch where not is_cycle order by depth desc
    `);
    return result.rows.map(
        row => (({ id: row.id, ...row.content } as unknown) as UIMessage)
    );
}
