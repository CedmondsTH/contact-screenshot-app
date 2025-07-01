'use client';

export default function ProcessingView() {
  return (
    <div className="card text-center fade-in">
      <div className="flex justify-center items-center mb-4">
        <div className="spinner rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
      <h2 className="text-2xl font-semibold text-primary-foreground bounce">
        Processing Images...
      </h2>
      <p className="text-muted-foreground mt-2">
        This may take a moment. We're extracting the contact details
        <span className="loading-dots ml-1">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </p>
      <div className="mt-4 w-full bg-secondary/30 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full progress-bar"></div>
      </div>
    </div>
  );
} 