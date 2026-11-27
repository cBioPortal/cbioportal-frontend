import { useState } from 'react';
import {
    ToolCallMessagePartComponent,
    ToolCallMessagePartStatus,
    useAuiState,
} from '@assistant-ui/react';
import {
    ApprovalCard,
    ApprovalState,
} from '@/components/assistant-ui/elements/approval-card';
import {
    GoToPageResult,
    NavigationDecision,
    setAlwaysAllowNavigation,
} from '@/lib/navigationApproval';
import { openPortalPage } from '@/lib/portal-link';

// As the go_to_page tool declares them in chat-sidebar-server/src/core.ts.
// The model writes `destination` for this card; navigation goes only by
// `url`.
type GoToPageArgs = { url: string; destination: string };

type CardView = { state: ApprovalState; statusLabel?: string };

// What the card shows for a go_to_page call, worked out from the call alone
// so a reloaded chat shows the same thing. Null renders nothing: a call still
// streaming, or one "Always allow" let through without asking.
export function goToPageCardView(
    status: ToolCallMessagePartStatus,
    result: GoToPageResult | undefined,
    isError: boolean | undefined,
    isLastMessage: boolean
): CardView | null {
    if (result?.decision === 'deny') {
        return { state: 'denied', statusLabel: 'Not opened' };
    }
    if (result?.decision) {
        return result.navigated
            ? { state: 'done', statusLabel: 'Opened' }
            : { state: 'done', statusLabel: "Couldn't open page" };
    }
    // The user sent a new message instead of answering.
    if (isError) return { state: 'denied', statusLabel: 'Skipped' };
    if (status.type === 'requires-action') {
        // A call left unanswered in an earlier reply can no longer continue it.
        return isLastMessage
            ? { state: 'request' }
            : { state: 'denied', statusLabel: 'Not opened' };
    }
    return null;
}

// The approval card for go_to_page: the assistant asks before it moves the
// portal, unless the user chose "Always allow". Answering supplies the tool
// output, which continues the reply.
export const GoToPageApproval: ToolCallMessagePartComponent<
    GoToPageArgs,
    GoToPageResult
> = ({ args, result, status, isError, addResult }) => {
    const isLastMessage = useAuiState(s => s.message.isLast);
    // Set on click so a second click can't answer again before the output
    // lands.
    const [answered, setAnswered] = useState<NavigationDecision | null>(null);

    const savedView = goToPageCardView(status, result, isError, isLastMessage);
    if (!savedView) return null;
    const view: CardView =
        savedView.state !== 'request' || !answered
            ? savedView
            : answered === 'deny'
            ? { state: 'denied', statusLabel: 'Not opened' }
            : { state: 'running', statusLabel: 'Opening…' };

    const answer = (decision: NavigationDecision) => {
        if (answered) return;
        setAnswered(decision);
        if (decision === 'deny') {
            addResult({ navigated: false, declined: true, decision });
            return;
        }
        if (decision === 'allow-always') setAlwaysAllowNavigation();
        addResult({ navigated: openPortalPage(args.url), decision });
    };

    return (
        <ApprovalCard
            className="my-2"
            state={view.state}
            statusLabel={view.statusLabel}
            title="Navigate to this page?"
            subtitle={args.destination}
            icon={null}
            onAllowOnce={() => answer('allow-once')}
            onAlwaysAllow={() => answer('allow-always')}
            onDeny={() => answer('deny')}
        />
    );
};
