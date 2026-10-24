import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================
// Button
// ============================================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-14 px-6 text-lg',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'bg-transparent text-accent hover:bg-accent-ghost',
    icon: 'glass-2 rounded-full p-2 hover:bg-white/80',
  };

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

// ============================================================
// GlassCard
// ============================================================
interface GlassCardProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function GlassCard({
  children,
  level = 2,
  className = '',
  onClick,
  clickable = false,
}: GlassCardProps) {
  const levelClass = level === 1 ? 'glass-1' : level === 2 ? 'glass-2' : 'glass-3';

  return (
    <div
      className={`${levelClass} rounded-2xl p-5 ${clickable || onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================
// Badge
// ============================================================
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: ReactNode;
  icon?: ReactNode;
}

export function Badge({ variant, children, icon }: BadgeProps) {
  const variantClasses = {
    success: 'bg-success/10 text-success-text',
    warning: 'bg-warning/10 text-warning-text',
    danger: 'bg-danger/10 text-danger-text',
    info: 'bg-info/10 text-info',
    neutral: 'bg-gray-100 text-text-secondary',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

// ============================================================
// WeatherIcon
// ============================================================
interface WeatherIconProps {
  code: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function WeatherIcon({ code, size = 'md' }: WeatherIconProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const iconMap: Record<number, string> = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '🌨️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };

  return (
    <span className={`${sizeClasses[size]} inline-block`} role="img" aria-label="وضعیت هوا">
      {iconMap[code] || '❓'}
    </span>
  );
}

// ============================================================
// ProgressBar
// ============================================================
interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function ProgressBar({ value, variant = 'success', size = 'md', showValue = false }: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    success: 'risk-green',
    warning: 'risk-yellow',
    danger: 'risk-red',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${sizeClasses[size]} bg-white/40 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${variantClasses[variant]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-medium tabular-nums w-8 text-left">{Math.round(value)}</span>
      )}
    </div>
  );
}

// ============================================================
// Modal
// ============================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-3 rounded-3xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              aria-label="بستن"
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-white/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Toast
// ============================================================
interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

export function Toast({ variant, message, onClose }: ToastProps) {
  const variantClasses = {
    success: 'bg-success/10 border-success/30 text-success-text',
    error: 'bg-danger/10 border-danger/30 text-danger-text',
    info: 'bg-info/10 border-info/30 text-info',
    warning: 'bg-warning/10 border-warning/30 text-warning-text',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className={`glass-2 border-2 rounded-2xl p-4 flex items-center gap-3 animate-fade-in ${variantClasses[variant]}`}>
      <span className="text-xl">{icons[variant]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/50" aria-label="بستن">
        ×
      </button>
    </div>
  );
}

// ============================================================
// Loader
// ============================================================
export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent" />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

// ============================================================
// EmptyState
// ============================================================
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-2 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-3 opacity-50">{icon}</div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// InfoButton (دکمه ℹ️ برای "چرا؟")
// ============================================================
interface InfoButtonProps {
  onClick: () => void;
  label?: string;
}

export function InfoButton({ onClick, label = 'چرا؟' }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
      aria-label={label}
    >
      <span>ℹ️</span>
      <span>{label}</span>
    </button>
  );
}
