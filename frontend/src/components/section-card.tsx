import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <p className="section-card__eyebrow">{title}</p>
          {subtitle ? <h2 className="section-card__subtitle">{subtitle}</h2> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
