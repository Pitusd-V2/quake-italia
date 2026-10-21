import { useCallback, useEffect, useState } from 'react';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function italianVoice(): SpeechSynthesisVoice | undefined {
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('it'));
}

/** Lettura ad alta voce con la sintesi vocale del dispositivo. */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {
    if (supported) speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    u.rate = 0.92;
    const v = italianVoice();
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  }, []);

  return { supported, speaking, speak, stop };
}
