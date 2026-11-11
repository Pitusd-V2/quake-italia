/**
 * Negli articoli le parole del glossario sono scritte <dfn>parola</dfn> la prima volta che compaiono. Qui, mentre
 * l'articolo viene preparato, quel marcatore diventa il componente «Termine» (src/learn/Termine.tsx): toccando la
 * parola si apre la sua spiegazione, presa dal glossario dello stesso articolo. Chi scrive non deve fare niente.
 *
 * Chi disegna un articolo deve quindi fornire «Termine» tra i componenti (LearnPages.tsx, scripts/check-article.mjs).
 */
interface Node {
  type: string;
  name?: string | null;
  children?: Node[];
}

export function remarkTermini() {
  const walk = (node: Node) => {
    if ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') && node.name === 'dfn') node.name = 'Termine';
    for (const child of node.children ?? []) walk(child);
  };
  return (tree: Node) => walk(tree);
}
