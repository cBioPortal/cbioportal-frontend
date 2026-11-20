import { NextFunction, Request, Response } from 'express';

// Deployed, the portal backend proxies every request and sets X-Chat-User from
// the logged-in principal, dropping any value the browser sent. This server is
// reachable only from inside the cluster, so the header is trusted as is.
// Locally there is no proxy, so DEV_CHAT_USER stands in for it — only under
// `pnpm dev`, which sets NODE_ENV=development, so a deployment that leaves
// NODE_ENV unset still answers a missing header with a 401.
const DEV_CHAT_USER =
    process.env.NODE_ENV === 'development'
        ? process.env.DEV_CHAT_USER?.trim() || undefined
        : undefined;

// Only the sidebar, on its own origin, reads and writes a user's chats. The
// browser's Sec-Fetch-Site marks a request from any other page, which is
// turned away whatever the CORS rules allow. Non-browser clients don't send it.
export function rejectCrossSite(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const site = req.header('Sec-Fetch-Site');
    if (site && site !== 'same-origin' && site !== 'none') {
        res.status(403).json({ error: 'cross-site request' });
        return;
    }
    next();
}

export function requireUser(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const userId = req.header('X-Chat-User')?.trim() || DEV_CHAT_USER;
    if (!userId) {
        res.status(401).json({ error: 'no user' });
        return;
    }
    res.locals.userId = userId;
    next();
}

export function userOf(res: Response): string {
    return res.locals.userId as string;
}
