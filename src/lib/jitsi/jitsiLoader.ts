/**
 * @feature JITSI_LOADER
 * @aiNote Dynamically loads the Jitsi Meet External API script
 */

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

export const loadJitsiScript = (): Promise<void> => {
    if (scriptLoaded) return Promise.resolve();
    if (scriptLoading) return scriptLoading;

    scriptLoading = new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI) {
            scriptLoaded = true;
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;

        script.onload = () => {
            scriptLoaded = true;
            resolve();
        };

        script.onerror = () => {
            scriptLoading = null;
            reject(new Error("Failed to load Jitsi script"));
        };

        document.body.appendChild(script);
    });

    return scriptLoading;
};

export const isJitsiLoaded = (): boolean => scriptLoaded;
