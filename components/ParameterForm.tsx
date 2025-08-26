
import React, { useMemo } from 'react';
import { ReportQuery, QueryParameter } from '../types';

interface ParameterFormProps {
  queries: ReportQuery[];
  values: Record<string, any>;
  onChange: (newValues: Record<string, any>) => void;
}

const ParameterForm: React.FC<ParameterFormProps> = ({ queries, values, onChange }) => {
  // Deduplicate parameters in case the same param name is used in multiple queries
  const uniqueParams = useMemo(() => {
    const paramsMap = new Map<string, QueryParameter>();
    queries.forEach(q => {
      q.params.forEach(p => {
        if (!paramsMap.has(p.name)) {
          paramsMap.set(p.name, p);
        }
      });
    });
    return Array.from(paramsMap.values());
  }, [queries]);

  const handleInputChange = (name: string, value: any, type: QueryParameter['type']) => {
    let processedValue = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    }
    if (type === 'boolean') {
      processedValue = (value as unknown as React.ChangeEvent<HTMLInputElement>).target.checked;
    }

    onChange({ ...values, [name]: processedValue });
  };
  
  const renderInput = (param: QueryParameter) => {
    const { name, type, label } = param;
    const value = values[name] ?? '';

    switch(type) {
      case 'date':
        return <input type="date" value={value} onChange={e => handleInputChange(name, e.target.value, type)} className="form-input" />;
      case 'number':
        return <input type="number" value={value} onChange={e => handleInputChange(name, e.target.value, type)} className="form-input" />;
      case 'boolean':
        return <input type="checkbox" checked={!!value} onChange={e => handleInputChange(name, e, type)} className="form-checkbox" />;
      case 'string':
      default:
        return <input type="text" value={value} onChange={e => handleInputChange(name, e.target.value, type)} className="form-input" />;
    }
  }

  if (uniqueParams.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: #374151; /* gray-700 */
          border-radius: 0.375rem; /* rounded-md */
          border: 1px solid #4b5563; /* gray-600 */
          color: #f3f4f6; /* gray-100 */
        }
        .form-input:focus {
          outline: none;
          border-color: #22d3ee; /* cyan-400 */
          box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.5);
        }
        .form-checkbox {
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 0.25rem;
            background-color: #374151;
            border-color: #4b5563;
        }
        .form-checkbox:checked {
            background-color: #06b6d4; /* cyan-600 */
        }
      `}</style>
      {uniqueParams.map(param => (
        <div key={param.name}>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {param.label || param.name}
          </label>
          {renderInput(param)}
        </div>
      ))}
    </div>
  );
};

export default ParameterForm;
