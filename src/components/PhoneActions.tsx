import React from 'react';
import { Check, Copy, MessageCircle, Phone } from 'lucide-react';
import { formatBdPhone, getTelHref, getWhatsAppHref } from '../utils/bengali';

interface PhoneActionsProps {
  phone: string;
  copied?: boolean;
  onCopy?: () => void;
  compact?: boolean;
}

export const PhoneActions: React.FC<PhoneActionsProps> = ({
  phone,
  copied = false,
  onCopy,
  compact = false,
}) => {
  const formatted = formatBdPhone(phone);
  if (!formatted) return null;

  const telHref = getTelHref(formatted);
  const waHref = getWhatsAppHref(formatted);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={telHref}
        title={`${formatted}-এ সরাসরি ফোন কল করুন`}
        className="font-mono text-xs font-medium text-slate-800 hover:text-[#0066E6] hover:underline tabular-nums whitespace-nowrap"
      >
        {formatted}
      </a>

      <div className="flex items-center gap-1">
        <a
          href={telHref}
          aria-label={`${formatted}-এ ফোন কল করুন`}
          title="সরাসরি ফোন কল"
          className="inline-flex items-center gap-1 rounded-lg border border-[#BFD9FA] bg-[#EBF4FF] px-2 py-1 text-[11px] font-semibold text-[#0066E6] transition-colors hover:border-[#0066E6] hover:bg-[#0066E6] hover:text-white whitespace-nowrap"
        >
          <Phone className="h-3 w-3" />
          {!compact && <span>কল</span>}
        </a>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${formatted}-এ হোয়াটসঅ্যাপ কল বা মেসেজ করুন`}
            title="হোয়াটসঅ্যাপে কল / মেসেজ"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:border-emerald-600 hover:bg-emerald-600 hover:text-white whitespace-nowrap"
          >
            <MessageCircle className="h-3 w-3" />
            {!compact && <span>WhatsApp</span>}
          </a>
        )}

        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            aria-label="মোবাইল নম্বর কপি করুন"
            title="নম্বর কপি করুন"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#DCE8F7] bg-white px-1.5 py-1 text-[11px] text-slate-500 transition-colors hover:bg-[#F1F6FC] hover:text-[#0066E6]"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
