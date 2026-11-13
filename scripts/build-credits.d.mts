/** Tipi di scripts/build-credits.mjs, per il test src/credits.test.ts. */
export declare const README: string;
export declare const START: string;
export declare const END: string;
export declare function line(s: { testo?: string; label?: string; url?: string }): string;
export declare function creditsSection(): string;
export declare function withCredits(readme: string, section?: string): string;
