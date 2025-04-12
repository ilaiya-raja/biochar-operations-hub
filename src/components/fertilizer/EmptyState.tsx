
import React from "react";

interface EmptyStateProps {
  message: string;
  submessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, submessage }) => {
  return (
    <div className="flex h-40 flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">{message}</p>
      {submessage && (
        <p className="text-sm text-muted-foreground">{submessage}</p>
      )}
    </div>
  );
};
