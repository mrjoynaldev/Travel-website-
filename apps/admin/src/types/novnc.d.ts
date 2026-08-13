declare module "@novnc/novnc" {
  export type RFBOptions = {
    credentials?: Record<string, string>;
    shared?: boolean;
    view_only?: boolean;
    wsProtocols?: string[];
    repeaterID?: string;
  };

  type RFBCustomEvent<T> = CustomEvent<T> & { detail: T };

  export default class RFB extends EventTarget {
    constructor(target: HTMLElement, url: string, options?: RFBOptions);

    get viewOnly(): boolean;
    set viewOnly(value: boolean);
    get clipViewport(): boolean;
    set clipViewport(value: boolean);
    get scaleViewport(): boolean;
    set scaleViewport(value: boolean);
    get resizeSession(): boolean;
    set resizeSession(value: boolean);
    get dragViewport(): boolean;
    set dragViewport(value: boolean);
    get showDotCursor(): boolean;
    set showDotCursor(value: boolean);
    get focused(): boolean;
    set focused(value: boolean);

    disconnect(): void;
    sendCredentials(creds: Record<string, string>): void;
    sendCtrlAltDel(): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    sendMouse?(): void;
    clipboardPasteFrom(text: string): void;

    addEventListener(
      type: "connect",
      handler: (event: RFBCustomEvent<Record<string, unknown>>) => void
    ): void;
    addEventListener(
      type: "disconnect",
      handler: (event: RFBCustomEvent<{ clean: boolean }>) => void
    ): void;
    addEventListener(
      type: "credentialsrequired",
      handler: (event: RFBCustomEvent<{ types: string[] }>) => void
    ): void;
    addEventListener(
      type: "securityfailure",
      handler: (event: RFBCustomEvent<{ reason?: string }>) => void
    ): void;
    addEventListener(
      type: "clipboard",
      handler: (event: RFBCustomEvent<{ text: string }>) => void
    ): void;
    addEventListener(type: "bell", handler: (event: Event) => void): void;
    addEventListener(
      type: "desktopname",
      handler: (event: RFBCustomEvent<{ name: string }>) => void
    ): void;
    addEventListener(
      type: "capabilities",
      handler: (event: RFBCustomEvent<Record<string, unknown>>) => void
    ): void;
    addEventListener(
      type: "clippingviewport",
      handler: (event: RFBCustomEvent<{ clipped: boolean }>) => void
    ): void;
    addEventListener(
      type: string,
      handler: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      type: string,
      handler: EventListenerOrEventListenerObject
    ): void;
  }
}
