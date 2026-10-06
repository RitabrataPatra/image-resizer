import { useEffect, useRef, useState } from 'react';
import { Coffee, X } from 'lucide-react';

const DISMISSED_STORAGE_KEY = 'exactspec-support-dismissed';
const DOWNLOAD_EVENT = 'exactspec:successful-download';

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutomaticPrompt, setIsAutomaticPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const automaticPromptDismissedRef = useRef(false);
  // const manuallyInteractedRef = useRef(false);
  const openTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    automaticPromptDismissedRef.current =
      window.localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';

    const handleSuccessfulDownload = () => {
      if (
        automaticPromptDismissedRef.current
      ) {
        return;
      }

      window.clearTimeout(openTimeoutRef.current ?? undefined);
      openTimeoutRef.current = window.setTimeout(() => {
        if (
          automaticPromptDismissedRef.current 
        ) {
          return;
        }
        setIsOpen(true);
        setIsAutomaticPrompt(true);
      }, 250);
    };

    window.addEventListener(DOWNLOAD_EVENT, handleSuccessfulDownload);
    return () => {
      window.removeEventListener(DOWNLOAD_EVENT, handleSuccessfulDownload);
      window.clearTimeout(openTimeoutRef.current ?? undefined);
    };
  }, []);

  const dismissPopup = (restoreFocus = false) => {
    if (isAutomaticPrompt) {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
      automaticPromptDismissedRef.current = true;
    }
    setIsOpen(false);
    setIsAutomaticPrompt(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        dismissPopup();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissPopup(true);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isAutomaticPrompt]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
    >
      <section
        id="support-exactspec-popup"
        hidden={!isOpen}
        role="dialog"
        aria-labelledby="support-exactspec-title"
        aria-describedby="support-exactspec-description"
        className="absolute bottom-full right-0 mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
      >
          <div className="flex items-start justify-between gap-3">
            <h2
              id="support-exactspec-title"
              className="text-base font-semibold text-slate-900"
            >
              ❤️ Enjoying ExactSpec?
            </h2>
            <button
              type="button"
              onClick={() => dismissPopup(true)}
              aria-label="Close support message"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <p
            id="support-exactspec-description"
            className="mt-2 text-sm leading-relaxed text-slate-600"
          >
            ExactSpec is free to use. If it helped you, consider supporting the
            project.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-60"
          >
            ☕ Support ExactSpec
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Support options are not available yet.
          </p>
      </section>

      <button
        ref={triggerRef}
        type="button"
        aria-label="Support ExactSpec"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="support-exactspec-popup"
        onClick={() => {
          if (isOpen) {
            dismissPopup();
            return;
          }
          window.clearTimeout(openTimeoutRef.current ?? undefined);
          openTimeoutRef.current = null;
          // manuallyInteractedRef.current = true;
          setIsAutomaticPrompt(false);
          setIsOpen(true);
        }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-md transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        <Coffee aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
