import { Pin, Minus, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PanelContextProvider } from '../../hooks/usePanelContext';

interface PanelWrapperProps {
  panelId: string;
  moduleId: string;
  name: string;
  color?: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  children: ReactNode;
}

const DEFAULT_COLOR = '#2563eb';

/**
 * Panel chrome: header bar (module color dot via background, name, pin/
 * minimize/close), consistent for every panel regardless of module. The
 * header is the react-grid-layout drag handle (see `.panel-drag-handle`
 * in Dashboard.tsx). Pinned panels show a filled pin icon and are excluded
 * from dragging by the grid itself (see Dashboard's `static` flag).
 */
export function PanelWrapper({
  panelId,
  moduleId,
  name,
  color,
  isPinned,
  onTogglePin,
  onClose,
  children,
}: PanelWrapperProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <PanelContextProvider value={{ panelId, moduleId }}>
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
        <div
          className="panel-drag-handle flex cursor-move items-center justify-between px-3 py-1.5"
          style={{ backgroundColor: color ?? DEFAULT_COLOR }}
        >
          <span className="truncate text-sm font-semibold uppercase tracking-wide text-white">{name}</span>
          {/* Stops the mousedown here so react-grid-layout's drag handler (bound to
              .panel-drag-handle above) never sees it and starts a drag — without this,
              a real mouse click on these buttons gets swallowed as a micro-drag and
              never fires. */}
          <div
            className="flex shrink-0 items-center gap-1 text-white/90"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={onTogglePin}
              className="rounded p-0.5 hover:bg-white/20"
              aria-label={isPinned ? 'Unpin panel' : 'Pin panel'}
              title={isPinned ? 'Unpin' : 'Pin in place'}
            >
              <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="rounded p-0.5 hover:bg-white/20"
              aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus size={14} />
            </button>
            <button onClick={onClose} className="rounded p-0.5 hover:bg-white/20" aria-label="Close panel" title="Hide">
              <X size={14} />
            </button>
          </div>
        </div>
        {isMinimized ? null : <div className="min-h-0 flex-1 overflow-auto">{children}</div>}
      </div>
    </PanelContextProvider>
  );
}
