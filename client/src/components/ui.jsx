import React from 'react';

// --- LAYOUT COMPONENTS ---

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}


// --- FORM COMPONENTS ---

export function Label({ children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}>
      {children}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input 
      className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select 
      className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea 
      className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors min-h-[100px] resize-y ${className}`}
      {...props}
    />
  );
}


// --- ACTION COMPONENTS ---

export function Button({ children, variant = 'primary', className = '', ...props }) {
  // Base styles applied to all buttons
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Specific styles based on the "variant" prop
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200 shadow-sm",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}