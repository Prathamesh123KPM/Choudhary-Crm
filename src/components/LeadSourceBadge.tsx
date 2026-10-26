import React from 'react';
import { Globe, UserCheck, Phone, Users, MessageSquare } from 'lucide-react';

interface LeadSourceBadgeProps {
  source: string;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

// Crisp official Facebook Icon
export const FacebookBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Authentic Instagram Icon with Brand Gradient
export const InstagramBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => {
  const gradientId = React.useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${gradientId}-ig`} r="150%" cx="30%" cy="107%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        ry="5.5"
        fill="none"
        stroke={`url(#${gradientId}-ig)`}
        strokeWidth="2.2"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke={`url(#${gradientId}-ig)`}
        strokeWidth="2.2"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill={`url(#${gradientId}-ig)`} />
    </svg>
  );
};

// WhatsApp Brand Icon
export const WhatsAppBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.175 8.175 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z" />
  </svg>
);

export const LeadSourceBadge: React.FC<LeadSourceBadgeProps> = ({
  source,
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  const normalized = (source || '').toLowerCase().trim();

  // Config mapping based on source brand colors with secondary background tints
  let config = {
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-200 dark:border-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-300',
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    iconBg: 'bg-neutral-200/50 dark:bg-neutral-800',
    icon: <Globe className="w-3.5 h-3.5" />,
    label: source || 'Direct'
  };

  if (normalized.includes('facebook') || normalized.includes('fb')) {
    config = {
      // Facebook brand blue #1877F2 with subtle secondary tint
      bg: 'bg-[#1877F2]/10 dark:bg-[#1877F2]/18',
      border: 'border-[#1877F2]/25 dark:border-[#1877F2]/40',
      text: 'text-[#105dc1] dark:text-[#60a5fa]',
      iconColor: 'text-[#1877F2] dark:text-[#60a5fa]',
      iconBg: 'bg-[#1877F2]/15 dark:bg-[#1877F2]/25',
      icon: <FacebookBrandIcon className="w-3.5 h-3.5 fill-[#1877F2] dark:fill-[#60a5fa]" />,
      label: source || 'Facebook Ads'
    };
  } else if (normalized.includes('instagram') || normalized.includes('ig') || normalized.includes('insta')) {
    config = {
      // Instagram brand rose/magenta #E1306C with subtle secondary tint
      bg: 'bg-[#E1306C]/10 dark:bg-[#E1306C]/18',
      border: 'border-[#E1306C]/25 dark:border-[#E1306C]/40',
      text: 'text-[#be185d] dark:text-[#f472b6]',
      iconColor: 'text-[#E1306C] dark:text-[#f472b6]',
      iconBg: 'bg-[#E1306C]/15 dark:bg-[#E1306C]/25',
      icon: <InstagramBrandIcon className="w-3.5 h-3.5" />,
      label: source || 'Instagram Ads'
    };
  } else if (normalized.includes('walk-in') || normalized.includes('walkin') || normalized.includes('walk in')) {
    config = {
      bg: 'bg-amber-500/10 dark:bg-amber-500/18',
      border: 'border-amber-500/25 dark:border-amber-500/40',
      text: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/15 dark:bg-amber-500/25',
      icon: <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      label: source || 'Walk-in'
    };
  } else if (normalized.includes('whatsapp') || normalized === 'wa' || normalized.startsWith('wa ')) {
    config = {
      // WhatsApp brand green #25D366 with subtle secondary tint
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/18',
      border: 'border-emerald-500/25 dark:border-emerald-500/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-[#25D366] dark:text-emerald-400',
      iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      icon: <WhatsAppBrandIcon className="w-3.5 h-3.5 fill-[#25D366] dark:fill-emerald-400" />,
      label: source || 'WhatsApp'
    };
  } else if (normalized.includes('website') || normalized.includes('form') || normalized.includes('web')) {
    config = {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/18',
      border: 'border-indigo-500/25 dark:border-indigo-500/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
      icon: <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
      label: source || 'Website Form'
    };
  } else if (normalized.includes('referral')) {
    config = {
      bg: 'bg-purple-500/10 dark:bg-purple-500/18',
      border: 'border-purple-500/25 dark:border-purple-500/40',
      text: 'text-purple-700 dark:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/15 dark:bg-purple-500/25',
      icon: <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
      label: source || 'Referral'
    };
  } else if (normalized.includes('call') || normalized.includes('manual')) {
    config = {
      bg: 'bg-slate-500/10 dark:bg-slate-500/18',
      border: 'border-slate-500/25 dark:border-slate-500/40',
      text: 'text-slate-700 dark:text-slate-300',
      iconColor: 'text-slate-600 dark:text-slate-400',
      iconBg: 'bg-slate-500/15 dark:bg-slate-500/25',
      icon: <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />,
      label: source || 'Manual Call'
    };
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap transition-colors shadow-2xs ${
        isSmall ? 'px-2.5 py-1 text-sm' : 'px-3 py-1.5 text-sm'
      } ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      {showIcon && (
        <span
          className="shrink-0 flex items-center justify-center rounded-xs w-4 h-4"
        >
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default LeadSourceBadge;
