import { and, eq, gt, sql } from 'drizzle-orm';
import { LanguageModelCallEndEvent, LanguageModelUsage } from 'ai';
import { db } from './db/client.js';
import { chatUsage } from './db/schema.js';

// Each model call is counted in weighted tokens, which follow the ratio
// providers charge between token types, so a call's count tracks roughly what
// it costs whichever model served it. One unit is a million weighted tokens;
// units have no money value.
const WEIGHTS = { noCache: 1, cacheRead: 0.1, cacheWrite: 1.25, output: 5 };
const WEIGHTED_PER_UNIT = 1_000_000;

function getAllowanceUnits(): number {
    const configured = process.env.CHAT_ALLOWANCE_UNITS;
    const units = Number(configured);
    if (!configured || !Number.isFinite(units) || units <= 0) {
        throw new Error(
            `CHAT_ALLOWANCE_UNITS must be a positive number of units, got "${configured ??
                ''}" — see .env.example.`
        );
    }
    return units;
}

function getWindowHours(): number {
    const configured = process.env.CHAT_WINDOW || '7d';
    const match = /^(\d+)([hd])$/.exec(configured);
    const count = match ? Number(match[1]) : 0;
    if (!match || count === 0) {
        throw new Error(
            `Invalid CHAT_WINDOW "${configured}" — expected hours or days, e.g. 12h or 7d.`
        );
    }
    return match[2] === 'd' ? count * 24 : count;
}

const ALLOWANCE_WEIGHTED = getAllowanceUnits() * WEIGHTED_PER_UNIT;
const WINDOW = sql`make_interval(hours => ${getWindowHours()})`;

function weigh(usage: LanguageModelUsage): number {
    const cacheRead = usage.inputTokenDetails.cacheReadTokens ?? 0;
    const cacheWrite = usage.inputTokenDetails.cacheWriteTokens ?? 0;
    const noCache =
        usage.inputTokenDetails.noCacheTokens ??
        Math.max(0, (usage.inputTokens ?? 0) - cacheRead - cacheWrite);
    // Includes reasoning tokens.
    const output = usage.outputTokens ?? 0;
    return Math.ceil(
        noCache * WEIGHTS.noCache +
            cacheRead * WEIGHTS.cacheRead +
            cacheWrite * WEIGHTS.cacheWrite +
            output * WEIGHTS.output
    );
}

// A failed write is logged rather than thrown, so a database problem never
// breaks a chat; that call just goes uncounted.
export async function recordCall(
    userId: string,
    event: LanguageModelCallEndEvent
): Promise<void> {
    try {
        await db
            .insert(chatUsage)
            .values({ userId, weighted: weigh(event.usage) });
    } catch (err) {
        console.error('recording usage failed:', err);
    }
}

function inWindow(userId: string) {
    return and(
        eq(chatUsage.userId, userId),
        eq(chatUsage.billedTo, 'portal'),
        gt(chatUsage.createdAt, sql`now() - ${WINDOW}`)
    );
}

export interface Usage {
    percentUsed: number;
    // When usage next falls below the allowance; null while it already is.
    availableAt: Date | null;
}

// Usage is the sum over a rolling window, so nothing resets: once over the
// allowance, the user can chat again when enough of their oldest usage has
// aged out of it.
export async function getUsage(userId: string): Promise<Usage> {
    // SUM is a bigint, which node-postgres returns as a string, and null when
    // there are no rows.
    const [{ used }] = await db
        .select({
            used: sql`coalesce(sum(${chatUsage.weighted}), 0)`.mapWith(Number),
        })
        .from(chatUsage)
        .where(inWindow(userId));
    const percentUsed = (used / ALLOWANCE_WEIGHTED) * 100;
    if (used < ALLOWANCE_WEIGHTED) return { percentUsed, availableAt: null };

    // The first row, oldest first, whose ageing out brings usage below the
    // allowance.
    const result = await db.execute<{ available_at: Date }>(sql`
        select created_at + ${WINDOW} as available_at
        from (
            select created_at,
                sum(weighted) over (order by created_at, id) as aged
            from ${chatUsage}
            where ${inWindow(userId)}
        ) w
        where ${used}::numeric - aged < ${ALLOWANCE_WEIGHTED}::numeric
        order by aged
        limit 1
    `);
    return {
        percentUsed,
        availableAt: new Date(result.rows[0]?.available_at ?? Date.now()),
    };
}

// Thrown by a route that would call a model for a user at their allowance;
// route() answers it with a 429.
export class UsageLimitError extends Error {
    constructor(readonly availableAt: Date) {
        super(`usage limit reached until ${availableAt.toISOString()}`);
    }
}

export async function requireAllowance(userId: string): Promise<void> {
    const { availableAt } = await getUsage(userId);
    if (availableAt) throw new UsageLimitError(availableAt);
}
