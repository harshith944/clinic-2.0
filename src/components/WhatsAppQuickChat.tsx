import { useState } from 'react';
import { ExternalLink, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { CLINIC_WHATSAPP_DISPLAY, PRIMARY_DOCTOR } from '../data/clinicData';
import { buildWhatsAppChatUrl } from '../utils/whatsapp';

interface WhatsAppQuickChatProps {
  onJumpToDoubts: () => void;
}

export function WhatsAppQuickChat({ onJumpToDoubts }: WhatsAppQuickChatProps) {
  const [open, setOpen] = useState(false);

  const directUrl = buildWhatsAppChatUrl(
    `Hello ${PRIMARY_DOCTOR.clinicName} (${PRIMARY_DOCTOR.name}), I have a quick question about my pet.`,
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      {open && (
        <div
          role="dialog"
          aria-label="Ajith Clinic WhatsApp Quick Chat"
          className="w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 block">
                {PRIMARY_DOCTOR.clinicName} · WhatsApp Desk
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Chat &amp; Verify Pet Doubts
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp quick chat"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Message {PRIMARY_DOCTOR.name} directly on WhatsApp ({CLINIC_WHATSAPP_DISPLAY}) or submit a clinical question for verified review.
          </p>

          <div className="mt-3.5 flex flex-col gap-2">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              Open WhatsApp Chat
              <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onJumpToDoubts();
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Verify Doubt with Dr. Elena
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="WhatsApp Chat and Patient Doubts"
        className="inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg transition-colors cursor-pointer whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        WhatsApp Chat
      </button>
    </div>
  );
}
