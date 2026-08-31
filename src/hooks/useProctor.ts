"use client";

import { useEffect, useRef } from "react";
import { studentApi } from "@/lib/api";
import { useExamStore } from "@/store/examStore";

const STRIKE_COALESCE_MS = 1500;

/**
 * Proctoring: detects tab switches, window blur, fullscreen exits (strikes),
 * blocks copy/paste/right-click (logged only), sends heartbeats, and reacts
 * to server-side auto-submission.
 *
 * A browser can detect and punish leaving the exam, not physically prevent it —
 * strikes are counted server-side and the 3rd one auto-submits.
 */
export function useProctor(enabled: boolean, onAutoSubmit: (reason: string) => void) {
  const lastStrikeAt = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const store = useExamStore;

    const finish = (reason: string) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      store.getState().markAutoSubmitted();
      onAutoSubmit(reason);
    };

    const reportStrike = async (kind: string) => {
      const now = Date.now();
      if (now - lastStrikeAt.current < STRIKE_COALESCE_MS) return;
      lastStrikeAt.current = now;
      if (submittedRef.current) return;
      store.getState().openOverlay(kind);
      try {
        const res = await studentApi.violation(kind);
        store.getState().setViolationState(res.violationCount, res.maxViolations);
        if (res.autoSubmitted) finish("violations");
      } catch {
        /* offline — the overlay still warns; server reconciles on next call */
      }
    };

    const reportLogged = (kind: string) => {
      studentApi.violation(kind).catch(() => {});
    };

    const onVisibility = () => {
      if (document.hidden) reportStrike("tab_hidden");
    };
    const onBlur = () => reportStrike("window_blur");
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) reportStrike("fullscreen_exit");
    };
    const block = (kind: string) => (e: Event) => {
      e.preventDefault();
      reportLogged(kind);
    };
    const onCopy = block("copy");
    const onCut = block("cut");
    const onPaste = block("paste");
    const onContextMenu = block("contextmenu");
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Heartbeat: keeps "last seen" fresh and notices server-side auto-submit
    // (time expiry via the sweeper, or a strike registered from another tab).
    const heartbeat = setInterval(async () => {
      if (submittedRef.current) return;
      try {
        const res = await studentApi.heartbeat();
        store
          .getState()
          .setViolationState(res.violationCount, store.getState().maxViolations);
        if (res.status !== "active") finish("time");
      } catch {
        /* transient network issue — try again next beat */
      }
    }, 15000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearInterval(heartbeat);
    };
  }, [enabled, onAutoSubmit]);
}
