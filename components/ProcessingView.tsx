'use client';

export default function ProcessingView() {
  return (
    <div className="card text-center">
      <div className="flex justify-center items-center mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
      <h2 className="text-2xl font-semibold text-primary-foreground">
        Processing Images...
      </h2>
      <p className="text-muted-foreground mt-2">
        This may take a moment. We're extracting the contact details.
      </p>
    </div>
  );
} 