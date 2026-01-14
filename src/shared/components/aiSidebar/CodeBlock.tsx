import * as React from 'react';
import { useState, useCallback, useEffect, useRef, memo } from 'react';
import hljs from 'highlight.js';

interface CodeBlockProps {
    children?: React.ReactNode;
    className?: string;
    inline?: boolean;
    node?: any;
}

/**
 * CodeBlock component for rendering code with syntax highlighting and copy functionality.
 * Used as a custom component override for react-markdown.
 */
export const CodeBlock = memo(({ children, className, inline }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    // Extract language from className (e.g., "language-sql" -> "sql")
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    // Get the text content for copying
    const codeString = String(children).replace(/\n$/, '');

    // Check if this is inline code or a code block
    const isInline = inline || !className;

    // Apply syntax highlighting
    useEffect(() => {
        if (codeRef.current && language && !isInline) {
            // Reset any previous highlighting
            codeRef.current.removeAttribute('data-highlighted');
            hljs.highlightElement(codeRef.current);
        }
    }, [codeString, language, isInline]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(codeString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    }, [codeString]);

    // Inline code - simple styling
    if (isInline) {
        return (
            <code className="inline-code">
                {children}
            </code>
        );
    }

    // Block code - with header bar and copy button
    return (
        <div className="code-block-container">
            <div className="code-block-header">
                <span className="code-language">{language || 'code'}</span>
                <button
                    className="copy-button"
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy code'}
                >
                    {copied ? (
                        <i className="fa-solid fa-check"></i>
                    ) : (
                        <i className="fa-solid fa-copy"></i>
                    )}
                </button>
            </div>
            <pre className="code-block-pre">
                <code ref={codeRef} className={language ? `language-${language}` : ''}>
                    {codeString}
                </code>
            </pre>
        </div>
    );
});

CodeBlock.displayName = 'CodeBlock';
