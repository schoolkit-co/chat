import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '~/utils';

interface PasswordInputProps {
  id: string;
  label: string;
  register: any;
  errors: any;
  autoComplete?: string;
  className?: string;
  labelClassName?: string;
  placeholder?: string;
  dataTestId?: string;
  required?: boolean;
  validation?: any;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  register,
  errors,
  autoComplete = 'new-password',
  className = '',
  labelClassName = '',
  placeholder = ' ',
  dataTestId,
  validation,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        aria-label={label}
        {...register(id, validation)}
        aria-invalid={!!errors[id]}
        className={cn(
          'webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light',
          'bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none',
          'pr-10', // Add padding to the right to make room for the eye button
          className,
        )}
        placeholder={placeholder}
        data-testid={dataTestId || id}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      <label
        htmlFor={id}
        className={cn(
          'absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2',
          'text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2',
          'peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5',
          'peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500',
          'rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4',
          labelClassName,
        )}
      >
        {label}
      </label>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );
};

export default PasswordInput;
