'use client';

import { useState } from 'react';
import { type ContactData } from '../types/contact';

interface ContactFormProps {
  contacts: ContactData[];
  error: string | null;
  onStartOver: () => void;
}

const FieldLabel = ({ field }: { field: string }) => {
  const getFieldLabel = (fieldName: string) => {
    if (fieldName === 'linkedIn') return 'LinkedIn URL';
    return fieldName.replace(/([A-Z])/g, ' $1');
  };
  
  return (
    <label className="block text-sm font-medium mb-1.5 capitalize text-muted-foreground">
      {getFieldLabel(field)}
    </label>
  );
};

const FieldInput = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  />
);

export default function ContactForm({ contacts, error, onStartOver }: ContactFormProps) {
  const [editableContacts, setEditableContacts] = useState(contacts);

  const handleDownload = async (contact: ContactData) => {
    try {
      const response = await fetch('/api/vcf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error('Failed to generate vCard');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'contact.vcf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download failed:', error);
      // You could show an error message to the user here
    }
  };

  const handleFieldChange = (index: number, field: keyof ContactData, value: string) => {
    const newContacts = [...editableContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEditableContacts(newContacts);
  };

  if (error) {
    return (
      <div className="bg-card border border-destructive/50 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-destructive">Processing Failed</h3>
        <p className="text-muted-foreground mt-2 mb-6">{error}</p>
        <button onClick={onStartOver} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {editableContacts.map((contact, index) => (
        <div key={index} className={`bg-card border border-border rounded-lg p-6 hover-scale card-enter stagger-${Math.min(index + 1, 3)}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">Contact Result {index + 1}</h3>
            </div>
            <button onClick={() => handleDownload(contact)} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 glow">
              Download vCard
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4">
            {[
              'firstName', 'lastName', 'fullName', 'title', 'company', 
              'email', 'mobilePhone', 'workPhone', 'linkedIn', 'website', 
              'address', 'street', 'city', 'state', 'zipCode', 'country'
            ].map((fieldKey) => (
              <div key={fieldKey}>
                <FieldLabel field={fieldKey} />
                <FieldInput 
                  value={(contact as any)[fieldKey] || ''} 
                  onChange={(e) => handleFieldChange(index, fieldKey as keyof ContactData, e.target.value)}
                />
              </div>
            ))}
          </div>

          {contact.rawText && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View Extracted Text
              </summary>
              <pre className="mt-2 p-3 bg-secondary/30 rounded-md text-xs whitespace-pre-wrap font-mono">
                {contact.rawText}
              </pre>
            </details>
          )}
        </div>
      ))}
      
      <div className="text-center pt-4">
        <button onClick={onStartOver} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2 rounded-md font-medium transition-all duration-200 hover:scale-105">
          Scan Another
        </button>
      </div>
    </div>
  );
} 