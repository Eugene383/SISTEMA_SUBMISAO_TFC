// src/components/input-group.tsx
import { LucideIcon } from 'lucide-react';

interface InputGroupProps {
  id: string;
  label: string;
  placeholder?: string;
  Icon?: LucideIcon;
  type?: 'text' | 'email' | 'password' | 'number';
  readOnly?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function InputGroup({
  id,
  label,
  placeholder,
  Icon,
  type = 'text',
  readOnly = false,
  required = false,
  value,
  onChange,
}: InputGroupProps) {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-foreground/80"
      >
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 rounded-lg 
                     border border-foreground/20 bg-background/50 
                     focus:outline-none focus:ring-2 focus:ring-primary/50 
                     transition placeholder:text-foreground/40
                     ${readOnly ? 'bg-background/30 text-foreground/70 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}
