import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { FeltPage } from './pages/FeltPage';
import { QuakesPage } from './pages/QuakesPage';
import { QuakeDetailPage } from './pages/QuakeDetailPage';
import { SafetyPage } from './pages/SafetyPage';
import { DamagePage } from './pages/DamagePage';
import { RumorsPage } from './pages/RumorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { InfoPage } from './pages/InfoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MyTownPage } from './pages/MyTownPage';
import { SequencePage } from './pages/SequencePage';
import { PrivacyPage } from './legal/PrivacyPage';
import { TermsPage } from './legal/TermsPage';
import { ArticlePage, LearnIndexPage } from './learn/LearnPages';

// La sezione esperti (grafici, tabelle) si scarica solo se serve.
const ExpertPage = lazy(() => import('./pages/expert/ExpertPage'));

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="ho-sentito" element={<FeltPage />} />
        <Route path="terremoti" element={<QuakesPage />} />
        <Route path="terremoto/:id" element={<QuakeDetailPage />} />
        <Route path="cosa-fare" element={<SafetyPage />} />
        <Route path="danni-casa" element={<DamagePage />} />
        <Route path="e-vero" element={<RumorsPage />} />
        <Route path="capire" element={<LearnIndexPage />} />
        <Route path="capire/:slug" element={<ArticlePage />} />
        <Route path="il-mio-comune" element={<MyTownPage />} />
        <Route path="sequenza/:id" element={<SequencePage />} />
        <Route path="impostazioni" element={<SettingsPage />} />
        <Route path="informazioni" element={<InfoPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="termini" element={<TermsPage />} />
        <Route path="analisi" element={<ExpertPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
