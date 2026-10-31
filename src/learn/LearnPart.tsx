import type { ReactNode } from 'react';

/** Titolo di una delle parti di un articolo «a strati» (la storia, i dati, l'approfondimento), con il suo numero. */
export function Part({ n, kicker, children }: { n: number; kicker: string; children: ReactNode }) {
  return (
    <div className="learn-part">
      <span className="learn-part__n" aria-hidden="true">
        {n}
      </span>
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{children}</h2>
      </div>
    </div>
  );
}
