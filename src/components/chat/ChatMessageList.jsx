'use client';

import { Fragment } from 'react';
import { ArrowRight } from '../icons.jsx';
import { WhatsappIcon } from '../WhatsappIcon.jsx';
import { ProductMatchCard } from './ProductMatchCard.jsx';

function renderInlineBold(text, keyPrefix) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`${keyPrefix}-b-${idx}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-t-${idx}`}>{part}</Fragment>;
  });
}

function FormattedMessageText({ text }) {
  const lines = String(text || '').split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  const flushList = (keySeed) => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${keySeed}`} className="wc-msg-list">
          {listItems.map((item, idx) => (
            <li key={`li-${keySeed}-${idx}`}>{renderInlineBold(item, `li-${keySeed}-${idx}`)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushList(index);
      return;
    }
    if (/^[-•*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-•*]\s+/, ''));
      return;
    }
    flushList(index);
    blocks.push(
      <p key={`p-${index}`} className="wc-msg-p">
        {renderInlineBold(trimmed, `p-${index}`)}
      </p>
    );
  });
  flushList('end');

  return <div className="wc-msg-text">{blocks}</div>;
}

export function ChatMessageList({
  messages = [],
  isLoading = false,
  onFollowUpAction,
  onProductSelect,
  endRef,
}) {
  return (
    <div className="wc-chat-thread-wrap">
      <div
        className="wc-chat-log"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation with Ask Weave 365"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`wc-msg-row ${isUser ? 'wc-msg-row-user' : 'wc-msg-row-assistant'}`}
            >
              <div className={`wc-msg-bubble ${isUser ? 'wc-msg-user' : 'wc-msg-assistant'}`}>
                {msg.imagePreviewUrl && (
                  <img
                    src={msg.imagePreviewUrl}
                    alt="Uploaded saree or fabric reference"
                    className="wc-msg-image"
                  />
                )}
                {msg.text && <FormattedMessageText text={msg.text} />}
              </div>

              {!isUser && Array.isArray(msg.products) && msg.products.length > 0 && (
                <div className="wc-products-stack" aria-label="Matching Weave 365 catalogue items">
                  {msg.products.map((product, idx) => (
                    <ProductMatchCard
                      key={`${msg.id}-prod-${product.id || idx}`}
                      product={product}
                      onSelect={onProductSelect}
                    />
                  ))}
                </div>
              )}

              {!isUser && msg.handoff?.show && msg.handoff?.whatsappUrl && (
                <div className="wc-handoff-card">
                  <div className="wc-handoff-copy">
                    {msg.handoff.label || 'Need direct sourcing support or custom loom pricing?'}
                  </div>
                  <a
                    href={msg.handoff.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wc-handoff-btn"
                  >
                    <WhatsappIcon size={15} aria-hidden="true" />
                    <span>Continue on WhatsApp</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </a>
                </div>
              )}

              {!isUser && Array.isArray(msg.followUps) && msg.followUps.length > 0 && (
                <div className="wc-followup-row">
                  {msg.followUps.map((action) => (
                    action.href ? (
                      <a
                        key={action.id}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wc-followup-chip wc-followup-chip-wa"
                      >
                        <WhatsappIcon size={13} aria-hidden="true" />
                        <span>{action.label}</span>
                      </a>
                    ) : (
                      <button
                        key={action.id}
                        type="button"
                        className="wc-followup-chip"
                        onClick={() => onFollowUpAction?.(action.id)}
                      >
                        {action.label}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {isLoading && (
        <div
          className="wc-typing-row"
          role="progressbar"
          aria-label="Ask Weave 365 is preparing a reply"
          aria-busy="true"
        >
          <span className="wc-typing-dot" aria-hidden="true" />
          <span className="wc-typing-dot" aria-hidden="true" />
          <span className="wc-typing-dot" aria-hidden="true" />
          <span className="wc-typing-text">Checking catalog…</span>
        </div>
      )}
    </div>
  );
}
