'use client';

interface ContactFormProps {
  contacts: any[];
  processingResults: any[];
  onContactsUpdated: (contacts: any[]) => void;
  onStartOver: () => void;
}

export default function ContactForm({ contacts, onStartOver }: ContactFormProps) {
  const handleDownload = () => {
    // Mock download functionality
    alert('VCF file would be downloaded here');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Contact Information</h2>
      
      {contacts.map((contact, index) => (
        <div key={index} className="card">
          <h3 className="font-semibold mb-4">{contact.fullName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input 
                type="email" 
                value={contact.email || ''} 
                className="input-field"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              <input 
                type="tel" 
                value={contact.phone || ''} 
                className="input-field"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company:</label>
              <input 
                type="text" 
                value={contact.company || ''} 
                className="input-field"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title:</label>
              <input 
                type="text" 
                value={contact.title || ''} 
                className="input-field"
                readOnly
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-center space-x-4">
        <button onClick={handleDownload} className="btn-primary">
          Download VCF Files
        </button>
        <button onClick={onStartOver} className="btn-secondary">
          Start Over
        </button>
      </div>
    </div>
  );
} 