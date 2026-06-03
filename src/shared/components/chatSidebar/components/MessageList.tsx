import * as React from 'react';
import { observer } from 'mobx-react';
import { reaction, IReactionDisposer } from 'mobx';
import { ChatMessage as ChatMessageType } from '../store/types';
import ChatMessage from './ChatMessage';
import styles from './MessageList.module.scss';

interface MessageListProps {
    messages: ChatMessageType[];
}

@observer
export default class MessageList extends React.Component<MessageListProps> {
    private listRef = React.createRef<HTMLDivElement>();
    private resizeObserver: ResizeObserver | null = null;
    private disposeReaction: IReactionDisposer | null = null;

    // While true the view stays pinned to the bottom as content streams in.
    // Turned off when the user scrolls the list, back on when they send a new
    // message.
    private autoScroll = true;

    // Snapshot of the scroll metrics at the previous scroll event, used to tell
    // user-driven scrolls apart from content/programmatic ones.
    private lastScrollTop = 0;
    private lastScrollHeight = 0;

    componentDidMount() {
        // MessageList does not re-render (and so componentDidUpdate does not
        // fire) when the store's messages array changes, so we react to the
        // observable directly: when the user sends a new message, snap back to
        // the bottom and resume following.
        this.disposeReaction = reaction(
            () => this.countUserMessages(),
            (count, prev) => {
                if (count > prev) {
                    this.autoScroll = true;
                    this.scrollToBottom();
                }
            }
        );
        this.scrollToBottom();
    }

    // Callback ref on the content element. MessageList does not re-render on
    // streaming deltas (those mutate a message's parts deep inside, re-rendering
    // only the child ChatMessage), so we follow growth by observing the
    // content's size. A callback ref is required because the content element
    // does not exist while the message list is empty — it only mounts once the
    // first message arrives, after componentDidMount has already run.
    private setContentRef = (node: HTMLDivElement | null) => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        if (node && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.autoScroll) this.scrollToBottom();
            });
            this.resizeObserver.observe(node);
        }
    };

    componentWillUnmount() {
        this.resizeObserver?.disconnect();
        this.disposeReaction?.();
    }

    private countUserMessages() {
        return this.props.messages.filter(m => m.role === 'user').length;
    }

    private scrollToBottom() {
        const el = this.listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        this.lastScrollTop = el.scrollTop;
        this.lastScrollHeight = el.scrollHeight;
    }

    private onScroll = () => {
        const el = this.listRef.current;
        if (!el) return;

        const prevTop = this.lastScrollTop;
        const prevHeight = this.lastScrollHeight;
        this.lastScrollTop = el.scrollTop;
        this.lastScrollHeight = el.scrollHeight;

        // Content shrinking (e.g. a reasoning block collapsing) can clamp
        // scrollTop down with no user action — never treat that as a scroll.
        if (el.scrollHeight < prevHeight) return;

        // Programmatic scrolls and content growth only ever push scrollTop
        // down; a decrease means the user scrolled up. A change while the
        // height is stable is also user-driven.
        const movedUp = el.scrollTop < prevTop - 1;
        const movedWhileStable =
            el.scrollHeight === prevHeight &&
            Math.abs(el.scrollTop - prevTop) > 1;
        if (movedUp || movedWhileStable) {
            this.autoScroll = false;
        }
    };

    render() {
        const { messages } = this.props;

        return (
            <div
                className={styles.list}
                ref={this.listRef}
                onScroll={this.onScroll}
            >
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        Ask me anything about this study or navigate cBioPortal.
                    </div>
                ) : (
                    <div className={styles.content} ref={this.setContentRef}>
                        {messages.map(msg => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
