import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import HelpSidebar from './HelpSidebar';

export default function HelpButton() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHelpOpen(true)}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary/20 hover:bg-primary/30 border-2 border-primary/40 text-primary shadow-lg z-40"
              data-testid="button-open-help"
            >
              <HelpCircle className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[hsl(222,47%,11%)] border-primary/20">
            <p className="text-sm text-white">Need help? Click for assistance</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <HelpSidebar isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
