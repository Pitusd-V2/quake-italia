import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="container stack-lg">
      <h1 tabIndex={-1}>Pagina non trovata</h1>
      <p>La pagina che cerchi non esiste. Forse il link non è corretto.</p>
      <Link to="/" className="btn btn--primary">
        Torna alla pagina iniziale
      </Link>
    </div>
  );
}
