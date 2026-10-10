"use client";
import type { ReactNode } from "react";
import { ArrowUpRight, X } from "lucide-react";
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap">
      {label && (
        <div className="between">
          <span>{label}</span>
          <b>{Math.round(value)}%</b>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progresso"}
      >
        <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
export function Stat({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: boolean;
}) {
  return (
    <article className={`stat ${accent ? "accent" : ""}`}>
      <div className="between">
        <span>{label}</span>
        <ArrowUpRight size={15} />
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}
export function Empty({
  title = "Ainda sem registros",
  text = "Adicione seu primeiro registro para começar.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-mark">↗</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export const Badge = ({ children }: { children: ReactNode }) => (
  <span className="badge">{children}</span>
);
