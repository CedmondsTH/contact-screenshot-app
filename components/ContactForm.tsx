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
            {contact.phone && (
              <div>
                <label className="block text-sm font-medium mb-1">Phone:</label>
                <input 
                  type="tel" 
                  value={contact.phone || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.mobilePhone && (
              <div>
                <label className="block text-sm font-medium mb-1">Mobile:</label>
                <input 
                  type="tel" 
                  value={contact.mobilePhone || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.workPhone && (
              <div>
                <label className="block text-sm font-medium mb-1">Work Phone:</label>
                <input 
                  type="tel" 
                  value={contact.workPhone || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.homePhone && (
              <div>
                <label className="block text-sm font-medium mb-1">Home Phone:</label>
                <input 
                  type="tel" 
                  value={contact.homePhone || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
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
            {contact.linkedIn && (
              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn:</label>
                <input 
                  type="url" 
                  value={contact.linkedIn || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.website && (
              <div>
                <label className="block text-sm font-medium mb-1">Website:</label>
                <input 
                  type="url" 
                  value={contact.website || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.headline && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">LinkedIn Headline:</label>
                <input 
                  type="text" 
                  value={contact.headline || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {contact.address && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address:</label>
                <input 
                  type="text" 
                  value={contact.address || ''} 
                  className="input-field"
                  readOnly
                />
              </div>
            )}
            {(contact.city || contact.state || contact.zipCode) && (
              <>
                {contact.city && (
                  <div>
                    <label className="block text-sm font-medium mb-1">City:</label>
                    <input 
                      type="text" 
                      value={contact.city || ''} 
                      className="input-field"
                      readOnly
                    />
                  </div>
                )}
                {contact.state && (
                  <div>
                    <label className="block text-sm font-medium mb-1">State:</label>
                    <input 
                      type="text" 
                      value={contact.state || ''} 
                      className="input-field"
                      readOnly
                    />
                  </div>
                )}
                {contact.zipCode && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Zip Code:</label>
                    <input 
                      type="text" 
                      value={contact.zipCode || ''} 
                      className="input-field"
                      readOnly
                    />
                  </div>
                )}
              </>
            )}
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