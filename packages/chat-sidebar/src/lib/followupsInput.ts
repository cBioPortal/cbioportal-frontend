import { ThreadMessage } from '@assistant-ui/react';
import { resolveCodeFile } from './codeFile';

// The part of the thread the follow-ups are generated from: the latest
// exchange only, as plain text. Tool calls, reasoning and attachments are left
// out — the answer already carries what the user saw.

export interface FollowupsExchange {
    messageId: string;
    question: string;
    answer: string;
}

// Bounds the request so a long answer or a pasted question can't slow it down.
const MAX_QUESTION_CHARS = 2000;
const MAX_ANSWER_CHARS = 8000;

// A fenced block, with the info string (language and optional filename)
// captured; the closing fence must match the opening one.
const CODE_FENCE = /^(`{3,}|~{3,})([^\n]*)\n[\s\S]*?^\1[ \t]*$/gm;
// A markdown link target with a #fragment, optionally followed by a title.
const LINK_FRAGMENT = /\]\(([^)\s#]*)#[^)\s]*((?:\s+"[^"]*")?)\)/g;

function textOf(message: ThreadMessage): string {
    return message.content
        .map(part => (part.type === 'text' ? part.text : ''))
        .filter(Boolean)
        .join('\n\n')
        .trim();
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Scripts become placeholders — the model only needs to know one was given.
// Link fragments go too: Study View's #filterJson= is long, and the page
// snapshot sent alongside already describes the current filters.
function compressAnswer(answer: string): string {
    return answer
        .replace(CODE_FENCE, (_match, _fence, info: string) => {
            const [language, ...meta] = info.trim().split(/\s+/);
            const { filename, named } = resolveCodeFile(
                language || undefined,
                meta.join(' ') || undefined
            );
            return `[${language || 'code'} code block${
                named ? `: ${filename}` : ''
            }]`;
        })
        .replace(LINK_FRAGMENT, (_match, url: string, title: string) =>
            url ? `](${url}${title})` : _match
        );
}

// Undefined unless the thread ends on a finished reply to a user message: a
// run that was stopped, failed or is waiting on a tool gets no follow-ups.
export function latestExchange(
    messages: readonly ThreadMessage[]
): FollowupsExchange | undefined {
    const answer = messages.at(-1);
    const question = messages.at(-2);
    if (answer?.role !== 'assistant' || answer.status?.type !== 'complete') {
        return undefined;
    }
    if (question?.role !== 'user') return undefined;
    const answerText = compressAnswer(textOf(answer));
    if (!answerText) return undefined;
    return {
        messageId: answer.id,
        question: truncate(textOf(question), MAX_QUESTION_CHARS),
        answer: truncate(answerText, MAX_ANSWER_CHARS),
    };
}
