"use client";

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/Toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 10000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      const scheduleRemove = (id: string) => {
        if (!toastTimeouts.has(id)) {
          const timeout = setTimeout(() => {
            toastTimeouts.delete(id);
            dispatch({ type: "REMOVE_TOAST", toastId: id });
          }, TOAST_REMOVE_DELAY);
          toastTimeouts.set(id, timeout);
        }
      };
      if (toastId) scheduleRemove(toastId);
      else state.toasts.forEach((t) => scheduleRemove(t.id));

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId
            ? t.id === toastId
              ? { ...t, open: false }
              : t
            : { ...t, open: false }
        ),
      };
    }

    case "REMOVE_TOAST":
      if (!action.toastId) return { ...state, toasts: [] };
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

/** Hook to use toast inside components */
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const dismiss = (toastId?: string) =>
    dispatch({ type: "DISMISS_TOAST", toastId });

  return { ...state, dismiss };
}

/** Imperative function to fire a toast anywhere */
export function toast(props: Omit<ToasterToast, "id" | "open">) {
  const id = genId();
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  const update = (updateProps: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...updateProps, id } });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}
