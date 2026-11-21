import { Building2, Home, MessageSquare, Phone, Video } from 'lucide-react';
import { APPOINTMENT_TYPES } from '../data/clinicData';
import type { AppointmentType } from '../types/clinic';

interface AppointmentTypesBarProps {
  selectedType: AppointmentType;
  onSelectType: (type: AppointmentType) => void;
}

const ICONS: Record<AppointmentType, typeof Building2> = {
  clinic: Building2,
  video: Video,
  audio: Phone,
  chat: MessageSquare,
  home: Home,
};

export function AppointmentTypesBar({
  selectedType,
  onSelectType,
}: AppointmentTypesBarProps) {
  const activeOption =
    APPOINTMENT_TYPES.find((item) => item.id === selectedType) ?? APPOINTMENT_TYPES[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Select Appointment Type
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {activeOption.description}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Appointment type"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2.5"
        >
          {APPOINTMENT_TYPES.map((option) => {
            const Icon = ICONS[option.id];
            const isActive = option.id === selectedType;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onSelectType(option.id)}
                className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold">{option.shortLabel}</span>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  ${option.fee}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
