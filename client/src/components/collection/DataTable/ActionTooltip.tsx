import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

type ActionTooltipProps = {
  text?: string;
  children: ReactNode;
};

const TooltipBubble = styled.div`
  position: fixed;
  z-index: 200;
  width: max-content;
  max-width: 14rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.75rem;
  line-height: 1.35;
  white-space: normal;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

export function ActionTooltip({ text, children }: ActionTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const show = useCallback(() => {
    if (!text) return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [text]);

  const hide = useCallback(() => {
    setCoords(null);
  }, []);

  return (
    <>
      <span
        ref={wrapRef}
        style={{ display: "inline-flex" }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {text &&
        coords &&
        createPortal(
          <TooltipBubble
            style={{
              top: coords.top,
              left: coords.left,
              transform: "translate(-50%, -100%)",
            }}
            role="tooltip"
          >
            {text}
          </TooltipBubble>,
          document.body,
        )}
    </>
  );
}
