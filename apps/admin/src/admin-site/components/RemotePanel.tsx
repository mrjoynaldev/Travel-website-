"use client";

import type RFB from "@novnc/novnc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Clipboard,
  ClipboardPaste,
  Download,
  Keyboard,
  Monitor,
  Power,
  PowerOff,
  Settings2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type Status = "idle" | "connecting" | "connected" | "disconnected";

const DEFAULT_URL = "ws://localhost:6080/websockify";

const SENS = 1.5;
const TAP_MS = 260;
const LONG_MS = 520;
const MOVE_PX = 10;
const PINCH_PX = 24;

const KEYSYM = {
  Ctrl: 0xffe3,
  Alt: 0xffe9,
  Shift: 0xffe1,
  Backspace: 0xff08,
  Tab: 0xff09,
  Enter: 0xff0d,
  Escape: 0xff1b,
  Delete: 0xffff,
  Up: 0xff52,
  Down: 0xff54,
  Left: 0xff51,
  Right: 0xff53,
  Home: 0xff50,
  End: 0xff57,
  PageUp: 0xff55,
  PageDown: 0xff56,
  A: 0x61,
  C: 0x63,
  V: 0x76,
  X: 0x78,
  Z: 0x7a,
  Y: 0x79,
};

type PointerRec = {
  sx: number;
  sy: number;
  px: number;
  py: number;
  t: number;
  moved: boolean;
};

export function RemotePanel() {
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const autoConnected = useRef(false);

  const [url, setUrl] = useState(() =>
    typeof window === "undefined"
      ? DEFAULT_URL
      : localStorage.getItem("vnc.url") || DEFAULT_URL
  );
  const [password, setPassword] = useState(() =>
    typeof window === "undefined"
      ? ""
      : sessionStorage.getItem("vnc.password") || ""
  );
  const [shared, setShared] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [desktopName, setDesktopName] = useState("");
  const [message, setMessage] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [trackpad, setTrackpad] = useState(() =>
    typeof window === "undefined"
      ? false
      : localStorage.getItem("vnc.trackpad") === "1"
  );
  const [scale, setScale] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);
  const [clip, setClip] = useState(false);
  const [dotCursor, setDotCursor] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const [remoteClip, setRemoteClip] = useState("");
  const [localClip, setLocalClip] = useState("");
  const [panelOpen, setPanelOpen] = useState(() =>
    typeof window === "undefined" ? false : !!localStorage.getItem("vnc.url")
  );
  const [showSetup, setShowSetup] = useState(() =>
    typeof window === "undefined" ? true : !localStorage.getItem("vnc.url")
  );

  const tp = useRef({
    w: 1,
    h: 1,
    k: 1,
    tx: 0,
    ty: 0,
    cx: 0.5,
    cy: 0.5,
    mode: "none" as
      | "none"
      | "cursor"
      | "leftDrag"
      | "rightDrag"
      | "zoom"
      | "pan"
      | "wheel",
    lastTap: 0,
    pointers: new Map<number, PointerRec>(),
    longPressTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    twoFinger: { d0: 0, mx: 0, my: 0 },
  });

  const screenRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0, width: 1, height: 1 };
    const rect = canvas.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const dispatchAt = useCallback(
    (
      type: string,
      options: {
        button?: number;
        buttons?: number;
        clientX: number;
        clientY: number;
      }
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: options.clientX,
          clientY: options.clientY,
          button: options.button ?? 0,
          buttons: options.buttons ?? 0,
        })
      );
    },
    []
  );

  const applyTransform = useCallback(() => {
    const st = tp.current;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transformOrigin = "0 0";
      canvas.style.transform = `translate(${st.tx}px, ${st.ty}px) scale(${st.k})`;
    }
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.left = `${st.tx}px`;
      overlay.style.top = `${st.ty}px`;
      overlay.style.width = `${st.w * st.k}px`;
      overlay.style.height = `${st.h * st.k}px`;
    }
    const dot = dotRef.current;
    if (dot) {
      dot.style.left = `${st.cx * st.k}px`;
      dot.style.top = `${st.cy * st.k}px`;
      dot.style.transform = `translate(-50%, -50%) scale(${1 / st.k})`;
    }
  }, []);

  const clampPan = useCallback(() => {
    const st = tp.current;
    const host = hostRef.current;
    const vw = host?.clientWidth ?? 1;
    const vh = host?.clientHeight ?? 1;
    const maxTx = st.w * st.k - vw;
    const maxTy = st.h * st.k - vh;
    st.tx = maxTx <= 0 ? 0 : Math.min(0, Math.max(-maxTx, st.tx));
    st.ty = maxTy <= 0 ? 0 : Math.min(0, Math.max(-maxTy, st.ty));
  }, []);

  const moveCursor = useCallback((dx: number, dy: number) => {
    const st = tp.current;
    st.cx = Math.max(0, Math.min(st.w, st.cx + dx));
    st.cy = Math.max(0, Math.min(st.h, st.cy + dy));
    const dot = dotRef.current;
    if (dot) {
      dot.style.left = `${st.cx * st.k}px`;
      dot.style.top = `${st.cy * st.k}px`;
    }
  }, []);

  const mouseAt = useCallback(
    (type: string, options: { button?: number; buttons?: number }) => {
      const st = tp.current;
      const rect = screenRect();
      dispatchAt(type, {
        button: options.button,
        buttons: options.buttons,
        clientX: rect.left + st.cx * st.k,
        clientY: rect.top + st.cy * st.k,
      });
    },
    [dispatchAt, screenRect]
  );

  const wheelAt = useCallback(
    (deltaX: number, deltaY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = screenRect();
      const st = tp.current;
      canvas.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          view: window,
          deltaX,
          deltaY,
          deltaMode: 0,
          clientX: rect.left + st.cx * st.k,
          clientY: rect.top + st.cy * st.k,
        })
      );
    },
    [screenRect]
  );

  const setupCanvas = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = host.querySelector("canvas");
    if (!canvas) return;
    const screen = canvas.parentElement as HTMLDivElement | null;
    if (!screen) return;
    canvasRef.current = canvas;
    screenRef.current = screen;
    screen.style.overflow = "hidden";
    screen.style.display = "block";
    canvas.style.margin = "0";
    canvas.style.outline = "none";
    canvas.style.transformOrigin = "0 0";
    canvas.tabIndex = 0;

    const measure = () => {
      const st = tp.current;
      const first = st.cx === 0.5 && st.cy === 0.5;
      st.w = Math.max(1, canvas.clientWidth);
      st.h = Math.max(1, canvas.clientHeight);
      if (first) {
        st.cx = st.w / 2;
        st.cy = st.h / 2;
      }
      st.cx = Math.max(0, Math.min(st.w, st.cx));
      st.cy = Math.max(0, Math.min(st.h, st.cy));
      clampPan();
      moveCursor(0, 0);
      applyTransform();
    };
    measure();
    observerRef.current?.disconnect();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [applyTransform, clampPan, moveCursor]);

  const connect = useCallback(async () => {
    const host = hostRef.current;
    if (!host || !url.trim()) return;
    rfbRef.current?.disconnect();
    observerRef.current?.disconnect();
    observerRef.current = null;
    host.replaceChildren();
    canvasRef.current = null;
    screenRef.current = null;
    setStatus("connecting");
    setMessage("");
    setNeedsPassword(false);
    setDesktopName("");

    const options: {
      shared?: boolean;
      view_only?: boolean;
      credentials?: Record<string, string>;
    } = { shared, view_only: viewOnly };
    if (password) options.credentials = { password };

    let rfb: RFB;
    try {
      const { default: RFBClass } = await import("@novnc/novnc");
      rfb = new RFBClass(host, url.trim(), options);
    } catch (error) {
      setStatus("disconnected");
      setMessage(
        error instanceof Error ? error.message : "Could not start connection"
      );
      return;
    }
    rfbRef.current = rfb;
    rfb.scaleViewport = scale;
    rfb.clipViewport = clip;
    rfb.showDotCursor = dotCursor;

    rfb.addEventListener("connect", () => {
      setStatus("connected");
      setNeedsPassword(false);
      setShowSetup(false);
      setupCanvas();
    });
    rfb.addEventListener("disconnect", event => {
      setStatus("disconnected");
      setMessage(event.detail.clean ? "Disconnected." : "Connection lost.");
    });
    rfb.addEventListener("credentialsrequired", event => {
      setNeedsPassword(true);
      if (event.detail.types?.includes("password") === false)
        toast.info(`Server requires: ${event.detail.types?.join(", ")}`);
    });
    rfb.addEventListener("securityfailure", event => {
      setStatus("disconnected");
      setMessage(
        event.detail.reason
          ? String(event.detail.reason)
          : "Security handshake failed."
      );
    });
    rfb.addEventListener("desktopname", event => {
      setDesktopName(String(event.detail.name ?? ""));
    });
    rfb.addEventListener("clipboard", event => {
      setRemoteClip(String(event.detail.text ?? ""));
    });
    rfb.addEventListener("bell", () => {
      toast.info("The remote machine rang the bell.");
    });
  }, [url, shared, viewOnly, password, scale, clip, dotCursor, setupCanvas]);

  const disconnect = useCallback(() => {
    rfbRef.current?.disconnect();
    observerRef.current?.disconnect();
    observerRef.current = null;
    const st = tp.current;
    if (st.longPressTimer) clearTimeout(st.longPressTimer);
    st.pointers.clear();
    st.mode = "none";
    st.k = 1;
    st.tx = 0;
    st.ty = 0;
    st.cx = 0.5;
    st.cy = 0.5;
    if (canvasRef.current) canvasRef.current.style.transform = "";
    rfbRef.current = null;
    canvasRef.current = null;
    screenRef.current = null;
    setStatus("idle");
    setMessage("");
    setNeedsPassword(false);
    setDesktopName("");
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  useEffect(() => {
    if (autoConnected.current) return;
    autoConnected.current = true;
    connect();
  }, [connect]);

  useEffect(() => {
    if (url && url !== DEFAULT_URL) {
      localStorage.setItem("vnc.url", url);
    } else {
      localStorage.removeItem("vnc.url");
    }
    localStorage.setItem("vnc.trackpad", trackpad ? "1" : "0");
  }, [url, trackpad]);

  useEffect(() => {
    sessionStorage.setItem("vnc.password", password);
  }, [password]);

  useEffect(() => {
    const rfb = rfbRef.current;
    if (!rfb) return;
    rfb.scaleViewport = scale;
    rfb.clipViewport = clip;
    rfb.showDotCursor = dotCursor;
  }, [scale, clip, dotCursor, status]);

  useEffect(() => {
    const st = tp.current;
    if (!trackpad) {
      st.mode = "none";
      st.k = 1;
      st.tx = 0;
      st.ty = 0;
      if (st.longPressTimer) clearTimeout(st.longPressTimer);
      st.pointers.clear();
      applyTransform();
    }
  }, [trackpad, applyTransform]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = tp.current;
      if (status !== "connected") return;
      st.pointers.set(e.pointerId, {
        sx: e.clientX,
        sy: e.clientY,
        px: e.clientX,
        py: e.clientY,
        t: performance.now(),
        moved: false,
      });
      overlayRef.current?.setPointerCapture(e.pointerId);

      if (st.pointers.size === 1) {
        st.mode = "none";
        if (st.longPressTimer) clearTimeout(st.longPressTimer);
        st.longPressTimer = setTimeout(() => {
          const rec = st.pointers.get(e.pointerId);
          if (rec && !rec.moved) {
            st.mode = "rightDrag";
            mouseAt("mousedown", { button: 2, buttons: 2 });
          }
        }, LONG_MS);
      } else if (st.pointers.size === 2) {
        if (st.longPressTimer) clearTimeout(st.longPressTimer);
        const [a, b] = [...st.pointers.values()];
        st.twoFinger.d0 = Math.hypot(a.sx - b.sx, a.sy - b.sy);
        st.twoFinger.mx = (a.px + b.px) / 2;
        st.twoFinger.my = (a.py + b.py) / 2;
      }
    },
    [status, mouseAt]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = tp.current;
      const rec = st.pointers.get(e.pointerId);
      if (!rec) return;
      const dx = e.clientX - rec.px;
      const dy = e.clientY - rec.py;
      rec.px = e.clientX;
      rec.py = e.clientY;

      if (st.pointers.size === 1) {
        const total = Math.hypot(e.clientX - rec.sx, e.clientY - rec.sy);
        if (st.mode === "none") {
          if (total <= MOVE_PX) return;
          if (st.longPressTimer) clearTimeout(st.longPressTimer);
          rec.moved = true;
          if (performance.now() - st.lastTap < 500) {
            st.mode = "leftDrag";
            mouseAt("mousedown", { button: 0, buttons: 1 });
          } else {
            st.mode = "cursor";
          }
        }
        if (st.mode === "cursor") {
          moveCursor(dx * SENS, dy * SENS);
          mouseAt("mousemove", { buttons: 0 });
        } else if (st.mode === "leftDrag") {
          moveCursor(dx * SENS, dy * SENS);
          mouseAt("mousemove", { button: 0, buttons: 1 });
        } else if (st.mode === "rightDrag") {
          moveCursor(dx * SENS, dy * SENS);
          mouseAt("mousemove", { button: 2, buttons: 2 });
        }
        return;
      }

      if (st.pointers.size === 2) {
        const [a, b] = [...st.pointers.values()];
        const d = Math.hypot(a.px - b.px, a.py - b.py);
        const mx = (a.px + b.px) / 2;
        const my = (a.py + b.py) / 2;
        if (st.mode === "none" || st.mode === "cursor") {
          if (st.longPressTimer) clearTimeout(st.longPressTimer);
          if (Math.abs(d - st.twoFinger.d0) > PINCH_PX) st.mode = "zoom";
          else if (
            Math.hypot(mx - st.twoFinger.mx, my - st.twoFinger.my) > MOVE_PX
          )
            st.mode = st.k > 1 ? "pan" : "wheel";
          st.twoFinger.d0 = d;
          st.twoFinger.mx = mx;
          st.twoFinger.my = my;
        }
        if (st.mode === "zoom") {
          const factor = d / st.twoFinger.d0;
          const rect = screenRect();
          const anchorX = (st.twoFinger.mx - rect.left) / st.k;
          const anchorY = (st.twoFinger.my - rect.top) / st.k;
          st.k = Math.max(1, Math.min(5, st.k * factor));
          st.tx = mx - anchorX * st.k;
          st.ty = my - anchorY * st.k;
          clampPan();
          applyTransform();
        } else if (st.mode === "pan") {
          st.tx += mx - st.twoFinger.mx;
          st.ty += my - st.twoFinger.my;
          clampPan();
          applyTransform();
        } else if (st.mode === "wheel") {
          wheelAt(mx - st.twoFinger.mx, my - st.twoFinger.my);
        }
        st.twoFinger.d0 = d;
        st.twoFinger.mx = mx;
        st.twoFinger.my = my;
      }
    },
    [moveCursor, mouseAt, wheelAt, applyTransform, clampPan, screenRect]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = tp.current;
      const rec = st.pointers.get(e.pointerId);
      if (!rec) return;
      const duration = performance.now() - rec.t;
      st.pointers.delete(e.pointerId);
      overlayRef.current?.releasePointerCapture(e.pointerId);

      if (st.pointers.size === 0) {
        if (st.longPressTimer) clearTimeout(st.longPressTimer);
        if (st.mode === "none") {
          if (duration < LONG_MS) {
            mouseAt("mousedown", { button: 0, buttons: 1 });
            mouseAt("mouseup", { button: 0, buttons: 0 });
            st.lastTap = performance.now();
          }
        } else if (st.mode === "rightDrag") {
          mouseAt("mouseup", { button: 2, buttons: 0 });
        } else if (st.mode === "leftDrag") {
          mouseAt("mouseup", { button: 0, buttons: 0 });
        }
        st.mode = "none";
        return;
      }

      if (st.pointers.size === 1) {
        if (st.longPressTimer) clearTimeout(st.longPressTimer);
        if (
          (st.mode === "none" || st.mode === "cursor") &&
          duration < TAP_MS &&
          !rec.moved
        ) {
          const first = st.pointers.values().next().value;
          if (first && performance.now() - first.t < TAP_MS && !first.moved) {
            mouseAt("mousedown", { button: 2, buttons: 2 });
            mouseAt("mouseup", { button: 2, buttons: 0 });
          }
        }
        st.mode = "none";
        const first = st.pointers.values().next().value as PointerRec;
        first.sx = first.px = e.clientX;
        first.sy = first.py = e.clientY;
        first.t = performance.now();
      }
    },
    [mouseAt]
  );

  const sendKey = useCallback(
    (keysym: number, code: string, down?: boolean) => {
      if (status !== "connected" || viewOnly) return;
      rfbRef.current?.sendKey(keysym, code, down);
    },
    [status, viewOnly]
  );

  const combo = useCallback(
    (keysym: number, code: string) => {
      sendKey(KEYSYM.Ctrl, "ControlLeft", true);
      sendKey(keysym, code);
      sendKey(KEYSYM.Ctrl, "ControlLeft", false);
    },
    [sendKey]
  );

  const copyRemoteToLocal = useCallback(() => {
    if (!remoteClip) return;
    navigator.clipboard
      .writeText(remoteClip)
      .then(() => toast.success("Copied remote clipboard to your device."))
      .catch(() => toast.error("Your browser blocked clipboard write."));
  }, [remoteClip]);

  const connected = status === "connected";
  const statusColor =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-stone-400";

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        title="Open remote desktop"
        className="flex w-10 shrink-0 items-center justify-center self-stretch border-l border-white/10 bg-[#10131a] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="absolute -rotate-90 whitespace-nowrap text-[11px] font-medium uppercase tracking-widest">
          Remote
        </span>
      </button>
    );
  }

  return (
    <aside className="flex w-[20rem] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[#10131a] text-white">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-white/80">
          <span className={`size-2 shrink-0 rounded-full ${statusColor}`} />
          <span className="truncate">
            {status === "connected"
              ? desktopName || "Remote desktop"
              : status === "connecting"
                ? "Connecting…"
                : "Remote desktop"}
          </span>
        </span>
        {status === "disconnected" && message && (
          <span className="truncate text-[11px] text-white/40" title={message}>
            {message}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn
            title="Connection settings"
            active={showSetup}
            onClick={() => setShowSetup(value => !value)}
          >
            <Settings2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Trackpad mode (virtual cursor)"
            active={trackpad}
            onClick={() => setTrackpad(value => !value)}
          >
            <Monitor className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Keyboard shortcuts"
            active={showKeys}
            onClick={() => setShowKeys(value => !value)}
          >
            <Keyboard className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Clipboard"
            active={clipboardOpen}
            onClick={() => setClipboardOpen(value => !value)}
          >
            <Clipboard className="h-4 w-4" />
          </IconBtn>
          {connected ? (
            <IconBtn title="Disconnect" onClick={disconnect}>
              <PowerOff className="h-4 w-4" />
            </IconBtn>
          ) : (
            <IconBtn title="Connect" onClick={connect}>
              <Power className="h-4 w-4" />
            </IconBtn>
          )}
          <IconBtn title="Hide panel" onClick={() => setPanelOpen(false)}>
            <ChevronRight className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={hostRef} className="absolute inset-0 overflow-hidden" />
        <div
          ref={overlayRef}
          className="absolute left-0 top-0 z-10"
          style={{
            touchAction: "none",
            pointerEvents: trackpad && connected ? "auto" : "none",
            cursor: trackpad ? "none" : "default",
          }}
          onContextMenu={event => {
            if (trackpad) event.preventDefault();
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            ref={dotRef}
            className="pointer-events-none absolute left-0 top-0 z-20 h-3 w-3 rounded-full border border-black bg-white shadow"
            style={{ display: trackpad && connected ? "block" : "none" }}
          />
        </div>
        {status === "connecting" && (
          <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
            Connecting to {url}…
          </div>
        )}
        {status === "disconnected" && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <div className="rounded-xl border border-white/10 bg-black/80 p-6 text-center">
              <p className="text-sm text-white/80">
                {message || "Disconnected."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" className="gap-2" onClick={connect}>
                  <Power className="h-4 w-4" />
                  Reconnect
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setShowSetup(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        )}
        {needsPassword && connected && (
          <div className="absolute inset-0 z-30 grid place-items-center">
            <div className="w-72 rounded-xl border border-white/10 bg-white p-5 shadow-lg">
              <p className="text-sm font-semibold text-slate-900">
                Password required
              </p>
              <Input
                type="password"
                autoFocus
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="VNC password"
                className="mt-3"
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    rfbRef.current?.sendCredentials({ password });
                    setNeedsPassword(false);
                  }
                }}
              />
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    rfbRef.current?.sendCredentials({ password });
                    setNeedsPassword(false);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Authenticate
                </Button>
                <Button size="sm" variant="outline" onClick={disconnect}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {(showSetup || status === "idle") && (
          <div className="absolute inset-0 z-40 overflow-y-auto bg-[#10131a] p-3">
            <Label className="text-[11px] text-white/40">WebSocket URL</Label>
            <Input
              value={url}
              onChange={event => setUrl(event.target.value)}
              placeholder="wss://host:6080/websockify"
              className="mt-1 h-9 border-white/10 bg-black text-xs text-white"
            />
            <Label className="mt-3 block text-[11px] text-white/40">
              Password (optional)
            </Label>
            <Input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="VNC password"
              className="mt-1 h-9 border-white/10 bg-black text-xs text-white"
            />
            <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={viewOnly}
                onChange={event => setViewOnly(event.target.checked)}
                className="size-3.5 accent-primary"
              />
              View only
            </label>
            <Button
              size="sm"
              className="mt-4 w-full gap-2"
              disabled={!url.trim()}
              onClick={() => {
                setShowSetup(false);
                connect();
              }}
            >
              <Power className="h-4 w-4" />
              Connect
            </Button>
            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              Requires a VNC server behind a WebSocket proxy (websockify). The
              URL and password are saved on this device.
            </p>
          </div>
        )}
      </div>

      {showKeys && connected && (
        <div className="max-h-44 shrink-0 overflow-y-auto border-t border-white/10 bg-zinc-950 p-2">
          <div className="flex flex-wrap gap-1">
            <KeyButton label="Ctrl+C" onClick={() => combo(KEYSYM.C, "KeyC")} />
            <KeyButton label="Ctrl+V" onClick={() => combo(KEYSYM.V, "KeyV")} />
            <KeyButton label="Ctrl+X" onClick={() => combo(KEYSYM.X, "KeyX")} />
            <KeyButton label="Ctrl+A" onClick={() => combo(KEYSYM.A, "KeyA")} />
            <KeyButton label="Ctrl+Z" onClick={() => combo(KEYSYM.Z, "KeyZ")} />
            <KeyButton label="Ctrl+Y" onClick={() => combo(KEYSYM.Y, "KeyY")} />
            <KeyButton
              label="Esc"
              onClick={() => sendKey(KEYSYM.Escape, "Escape")}
            />
            <KeyButton label="Tab" onClick={() => sendKey(KEYSYM.Tab, "Tab")} />
            <KeyButton
              label="Enter"
              onClick={() => sendKey(KEYSYM.Enter, "Enter")}
            />
            <KeyButton
              label="Del"
              onClick={() => sendKey(KEYSYM.Delete, "Delete")}
            />
            <KeyButton
              label="Bksp"
              onClick={() => sendKey(KEYSYM.Backspace, "Backspace")}
            />
            <KeyButton
              label="Home"
              onClick={() => sendKey(KEYSYM.Home, "Home")}
            />
            <KeyButton label="End" onClick={() => sendKey(KEYSYM.End, "End")} />
            <KeyButton
              label="PgUp"
              onClick={() => sendKey(KEYSYM.PageUp, "PageUp")}
            />
            <KeyButton
              label="PgDn"
              onClick={() => sendKey(KEYSYM.PageDown, "PageDown")}
            />
            <KeyButton
              label="←"
              onClick={() => sendKey(KEYSYM.Left, "ArrowLeft")}
            />
            <KeyButton
              label="→"
              onClick={() => sendKey(KEYSYM.Right, "ArrowRight")}
            />
            <KeyButton
              label="↑"
              onClick={() => sendKey(KEYSYM.Up, "ArrowUp")}
            />
            <KeyButton
              label="↓"
              onClick={() => sendKey(KEYSYM.Down, "ArrowDown")}
            />
            <KeyButton
              label="Ctrl+Alt+Del"
              onClick={() => rfbRef.current?.sendCtrlAltDel()}
            />
          </div>
        </div>
      )}

      {clipboardOpen && connected && (
        <div className="border-t border-white/10 bg-zinc-950 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ClipboardPaste className="h-4 w-4 shrink-0 text-white/50" />
              <textarea
                value={localClip}
                onChange={event => setLocalClip(event.target.value)}
                placeholder="Type or paste text, then send it into the remote clipboard."
                rows={2}
                className="min-w-0 flex-1 resize-none rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-primary"
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                rfbRef.current?.clipboardPasteFrom(localClip);
                toast.success("Sent to remote clipboard.");
              }}
            >
              Send to remote
            </Button>
          </div>
          {remoteClip && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-white/70">
                Remote clipboard: {remoteClip}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-white"
                onClick={copyRemoteToLocal}
              >
                Copy to device
              </Button>
            </div>
          )}
        </div>
      )}

      {trackpad && connected && (
        <p className="shrink-0 border-t border-white/10 bg-zinc-950 px-3 py-1.5 text-[10px] leading-relaxed text-white/40">
          One finger drags the cursor, tap = left-click, long-press =
          right-click, tap-then-drag = drag/select, two-finger pinch = zoom,
          two-finger drag = pan (or scroll at 1×).
        </p>
      )}
    </aside>
  );
}

function IconBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function KeyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/15"
    >
      {label}
    </button>
  );
}
