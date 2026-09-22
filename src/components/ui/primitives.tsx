import { AlertTriangle, CheckCircle2, CircleDot, Info, Radio, Unplug } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "safe" | "caution" | "danger" | "info" | "offline" | "synthetic";
const icons = {
  safe: CheckCircle2,
  caution: AlertTriangle,
  danger: AlertTriangle,
  info: Info,
  offline: Unplug,
  synthetic: Radio,
};

export function StatusBadge({
  tone = "info",
  children,
}: {
  readonly tone?: Tone;
  readonly children: ReactNode;
}) {
  const Icon = icons[tone];
  return (
    <span className={`status-badge status-${tone}`}>
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Panel({
  title,
  eyebrow,
  actions,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  readonly title?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`} {...props}>
      {title ? (
        <header className="panel-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{title}</h2>
          </div>
          {actions}
        </header>
      ) : null}
      <div className="panel-content">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Field wraps a native control child; associated labels are checked in the browser.
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Metric({
  label,
  value,
  note,
}: {
  readonly label: string;
  readonly value: ReactNode;
  readonly note?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <CircleDot aria-hidden="true" />
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  readonly tone?: Tone;
  readonly children: ReactNode;
}) {
  const Icon = icons[tone];
  return (
    <div className={`banner status-${tone}`}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
