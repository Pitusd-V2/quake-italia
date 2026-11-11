import { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { matchTerm } from './searchEngine';

type Glossario = { termine: string; definizione: string }[];

/** Il glossario dell'articolo che si sta leggendo: lo fornisce la pagina dell'articolo. */
export const GlossarioContext = createContext<Glossario>([]);

/** Il testo dentro a un elemento (una parola del glossario può avere dentro un corsivo). */
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement<{ children?: ReactNode }>(c) ? textOf(c.props.children) : ''))
    .join('');
}

/**
 * Una parola della scienza dentro al testo di un articolo (scritta <dfn>parola</dfn>, vedi plugins/termini.ts).
 * Se il glossario dell'articolo la spiega, la parola diventa un pulsante: un tocco apre la spiegazione in un
 * fumetto sotto la parola, senza spezzare la frase. Si chiude con un altro tocco, toccando fuori o con Esc.
 * Se il glossario non la spiega resta una parola in evidenza, come prima.
 */
export function Termine({ children }: { children?: ReactNode }) {
  const glossario = useContext(GlossarioContext);
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const hit = glossario[matchTerm(textOf(children), glossario.map((g) => g.termine))];
  if (!hit) return <dfn>{children}</dfn>;
  return (
    <span className="term" ref={box}>
      <dfn>
        <button type="button" className="term__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {children}
        </button>
      </dfn>
      {open && (
        <span id={id} className="term__def" role="note">
          <span className="strong">{hit.termine}.</span> {hit.definizione}
        </span>
      )}
    </span>
  );
}
