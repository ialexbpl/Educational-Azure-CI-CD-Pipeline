import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmationModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description 
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">{title}</DialogTitle>
          <DialogDescription className="text-[#8b949e]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-[#30363d] text-[#e6edf3] hover:bg-[#30363d]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
