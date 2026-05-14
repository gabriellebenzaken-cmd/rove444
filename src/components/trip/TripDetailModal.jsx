import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

/**
 * Unified modal wrapper for Trip Detail dialogs.
 * Ensures all modals are consistently centered, sized, and styled.
 */
export default function TripDetailModal({
  open,
  onOpenChange,
  title,
  children,
  showHeader = true,
  maxHeightClass = "max-h-[calc(100vh-120px)]",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-48px)] max-w-[420px] rounded-3xl bg-white dark:bg-card border-0 shadow-2xl p-0 z-50 [&>button]:hidden">
        {/* Inner padding wrapper */}
        <div className={`flex flex-col h-full overflow-hidden`}>
          {/* Header with close button */}
          {showHeader && (
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/30">
              {title && (
                <DialogTitle className="text-base font-semibold">
                  {title}
                </DialogTitle>
              )}
              {!title && <div />}
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className={`flex-1 overflow-y-auto ${maxHeightClass} px-6 ${showHeader ? 'py-4' : 'py-6'} pb-6`}>
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}