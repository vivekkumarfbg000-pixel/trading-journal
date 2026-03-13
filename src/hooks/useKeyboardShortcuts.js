import { useEffect, useState } from 'react';

export default function useKeyboardShortcuts(actions) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        // Except for Escape which should blur inputs or close modals
        if (e.key === 'Escape' && actions.Escape) {
          actions.Escape(e);
        }
        return;
      }

      // Modifier key combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault(); // Prevent browser search box
            if (actions.CmdK) actions.CmdK(e);
            break;
          case 'd':
            e.preventDefault(); // Prevent bookmark
            if (actions.CmdD) actions.CmdD(e);
            break;
          default:
            break;
        }
        return;
      }

      // Single key shortcuts
      switch (e.key) {
        case '?':
          if (actions.QuestionMark) actions.QuestionMark(e);
          break;
        case 'Escape':
          if (actions.Escape) actions.Escape(e);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          if (actions.TabKeys) actions.TabKeys(e.key);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
