import { Mail, Lock, User } from 'lucide-react';
import { InputHTMLAttributes, useId } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ICON_MAP = {
  email: Mail,
  password: Lock,
  username: User,
} as const;

interface WelcomeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  customType?: 'email' | 'password' | 'username';
  errorMessage?: string;
}

/**
 * WelcomeInput - Input avec style cyan/bleu pour WelcomePage
 */
export const WelcomeInput = ({
  containerClassName = '',
  customType,
  errorMessage,
  id,
  ...props
}: WelcomeInputProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(errorMessage);
  const Icon = customType ? ICON_MAP[customType] : null;

  let type = 'text';
  switch (customType) {
    case 'password':
      type = 'password';
      break;
    case 'email':
      type = 'email';
      break;
    default:
      type = 'text';
  }

  const borderClass = hasError
    ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
    : 'border-gray-300 focus:ring-[#0088ff] focus:border-[#0088ff]';

  return (
    <div className={cn(`flex flex-col gap-1 w-full`, containerClassName)}>
      <div className="relative flex items-center">
        {Icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors"
            aria-hidden="true"
          >
            <Icon size={20} />
          </div>
        )}
        <label htmlFor={inputId} className="sr-only">
          {props.placeholder}
        </label>
        <input
          {...props}
          id={inputId}
          type={type}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'w-full rounded-lg border-2 py-2 text-sm transition-all focus:outline-none focus:ring-2',
            'bg-white text-gray-800 placeholder:text-gray-400',
            'ring-offset-2 ring-offset-transparent',
            Icon ? 'pl-10 pr-4' : 'px-4',
            borderClass,
          )}
        />
      </div>

      {hasError && (
        <span id={errorId} role="alert" className="text-sm text-red-600 font-semibold">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
