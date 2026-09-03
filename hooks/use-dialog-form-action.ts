"use client";

import { useState, useTransition } from "react";

/**
 * Wraps a Server Action for use inside a Dialog: closes the dialog on
 * success without reacting to state changes in a useEffect (setState should
 * happen where the action is triggered, not as a derived effect).
 */
export function useDialogFormAction<S extends { error?: string; success?: boolean }>(
  action: (prevState: S, formData: FormData) => Promise<S>,
  initialState: S
) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<S>(initialState);
  const [pending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.success) setOpen(false);
    });
  }

  return { open, setOpen, state, formAction, pending };
}
