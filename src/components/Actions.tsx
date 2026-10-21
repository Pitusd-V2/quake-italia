import { useState } from 'react';
import { Check, Share2, Square, Volume2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

/** "Ascolta": legge il testo ad alta voce, utile a chi vede poco. */
export function SpeakButton({ text, label = 'Ascolta' }: { text: string; label?: string }) {
  const { supported, speaking, speak, stop } = useSpeech();
  if (!supported) return null;
  return (
    <button
      type="button"
      className="btn btn--secondary"
      aria-pressed={speaking}
      onClick={() => (speaking ? stop() : speak(text))}
    >
      {speaking ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      {speaking ? 'Ferma la lettura' : label}
    </button>
  );
}

/** Condivisione (WhatsApp, SMS...) con il pannello del telefono, o copia del testo. */
export function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* l'utente ha annullato */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      window.prompt('Copia questo testo:', `${text}\n${url}`);
    }
  };
  return (
    <>
      <button type="button" className="btn btn--secondary" onClick={share}>
        {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        {copied ? 'Testo copiato' : 'Condividi'}
      </button>
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Testo copiato: ora puoi incollarlo in un messaggio.' : ''}
      </span>
    </>
  );
}
