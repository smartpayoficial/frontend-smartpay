import React from 'react';

const DynamicForm = ({ fields, formData, handleInputChange }) => {

  const handlePhoneCodeChange = (e, fieldName) => {
    // Solo números, máximo 3 dígitos
    const code = e.target.value.replace(/\D/g, '').slice(0, 3);
    handleInputChange({
      target: {
        name: fieldName,
        value: code ? `+${code}` : '+00',
      },
    });
  };

  const handlePhoneNumberChange = (e, fieldName) => {
    // Solo números, máximo 10 dígitos
    const number = e.target.value.replace(/\D/g, '').slice(0, 10);
    handleInputChange({
      target: {
        name: fieldName,
        value: number,
      },
    });
  };

  return (
    <div>
      {fields.map(field => {
        const { name, label, type, required, options, placeholder } = field;
        const inputId = `form-input-${name}`;
        const value = formData[name] || '';

        // Campo de código de país
        if (type === 'phone_code') {
          return (
            <div key={name} className="mb-4 relative w-28">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{1,3}"
                value={value.replace('+','')}
                onChange={(e) => handlePhoneCodeChange(e, name)}
                placeholder={placeholder || '00'}
                required={required}
                className="mt-1 block w-full pl-6 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          );
        }

        // Campo de número de teléfono
        if (type === 'tel') {
          return (
            <div key={name} className="mb-4">
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                id={inputId}
                value={value}
                onChange={(e) => handlePhoneNumberChange(e, name)}
                placeholder={placeholder || '1234567890'}
                maxLength={10}
                required={required}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          );
        }

        // Select
        if (type === 'select') {
          return (
            <div key={name} className="mb-4">
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
              <select
                id={inputId}
                name={name}
                value={value || ''}
                onChange={handleInputChange}
                required={required}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Seleccione una opción</option>
                {options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          );
        }

        // Textarea
        if (type === 'textarea') {
          return (
            <div key={name} className="mb-4">
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
              <textarea
                id={inputId}
                name={name}
                value={value || ''}
                onChange={handleInputChange}
                required={required}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          );
        }

        // Default input
        return (
          <div key={name} className="mb-4">
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
            <input
              type={type}
              id={inputId}
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              required={required}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        );
      })}
    </div>
  );
};

export default DynamicForm;
