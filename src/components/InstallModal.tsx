import { useEffect, useState } from "react";
import { Btn, Chip, Modal } from "./ui";
import { IconCheck, IconDownload, IconInfo } from "./icons";
import { installable, isInstalledApp, isMac, onInstallChange, promptInstall } from "../lib/install";

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-7 h-7 rounded-md bg-ink text-paper font-mono text-[12px] font-semibold flex items-center justify-center shrink-0">
        {n}
      </span>
      <div className="text-[13px] leading-relaxed text-mute">
        <span className="font-semibold text-ink">{title}</span> {children}
      </div>
    </div>
  );
}

export default function InstallModal({ onClose }: { onClose: () => void }) {
  const [canPrompt, setCanPrompt] = useState(installable());
  const [installed, setInstalled] = useState(isInstalledApp());
  const [outcome, setOutcome] = useState<"idle" | "accepted" | "dismissed">("idle");

  useEffect(() => {
    const refresh = () => {
      setCanPrompt(installable());
      setInstalled(isInstalledApp());
    };
    return onInstallChange(refresh);
  }, []);

  const doInstall = async () => {
    const r = await promptInstall();
    if (r === "accepted") setOutcome("accepted");
    else if (r === "dismissed") setOutcome("dismissed");
  };

  return (
    <Modal kicker="Desktop app" title="Install OpenMedicine on your Mac" onClose={onClose}>
      {/* app identity strip */}
      <div className="flex items-center gap-4 bg-ink text-paper rounded-md p-4 mb-5">
        <img src="/icons/icon.svg" alt="OpenMedicine app icon" className="w-14 h-14 rounded-[14px] shadow-pop" />
        <div className="flex-1 min-w-0">
          <div className="font-display font-extrabold text-[17px] tracking-tight">OpenMedicine</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/45 mt-0.5">
            Question banks · practice · timed exams
          </div>
        </div>
        <Chip tone="moss" className="shrink-0">v1.0</Chip>
      </div>

      {installed ? (
        <div className="flex items-start gap-3 border border-moss/40 bg-moss-soft/60 rounded-md px-4 py-3.5 anim-pop">
          <IconCheck className="text-moss-deep text-lg shrink-0 mt-0.5" />
          <div className="text-[13.5px] leading-relaxed text-mute">
            <strong className="text-moss-deep">You're already running OpenMedicine as an app.</strong>{" "}
            Find it in Launchpad or Spotlight (<kbd className="font-mono text-[11px] bg-card border border-line rounded px-1">⌘ Space</kbd> → “OpenMedicine”).
          </div>
        </div>
      ) : (
        <>
          {canPrompt && (
            <div className="border border-moss/40 bg-moss-soft/50 rounded-md p-4 mb-5 anim-pop">
              <div className="flex items-center gap-2 font-display font-bold text-moss-deep text-[15px]">
                <span className="w-2 h-2 rounded-full bg-moss anim-pulse-dot" />
                One-click install available in this browser
              </div>
              <p className="text-[13px] text-mute mt-1.5 leading-relaxed">
                It downloads the app shell, creates a real <strong className="text-body">OpenMedicine.app</strong> on this
                Mac and puts it in your Dock — no browser bar, launches from Spotlight.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3.5">
                <Btn onClick={doInstall}>
                  <IconDownload /> Install OpenMedicine
                </Btn>
                {outcome === "dismissed" && (
                  <span className="text-[12.5px] font-medium text-[#8a5a10] anim-fade-in">
                    No problem — the manual route below works just as well.
                  </span>
                )}
                {outcome === "accepted" && (
                  <span className="text-[12.5px] font-semibold text-moss-deep anim-fade-in">
                    Installing — watch the Dock.
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute">
              {canPrompt ? "Or the long way" : isMac() ? "Two clicks in your browser" : "Install from any browser"}
            </div>

            <Step n="A" title="Chrome, Edge, Arc or Brave:">
              look for the small <strong className="text-body">install icon</strong> at the right end of the address bar and
              click <em>Install</em> — or open the <strong className="text-body">⋮ menu → Cast, save and share → Install
              OpenMedicine…</strong>
            </Step>
            <Step n="B" title="Safari on macOS Sonoma or newer:">
              choose <strong className="text-body">File → Add to Dock…</strong> and press <em>Add</em>. (Older macOS:
              the Share button → <em>Add to Dock</em>.)
            </Step>
            <Step n="C" title="Launch it like any Mac app:">
              Spotlight, Launchpad or the Dock. Your banks, results and account live in this Mac's storage and work{" "}
              <strong className="text-body">fully offline</strong>.
            </Step>
          </div>

          <div className="flex items-start gap-2.5 mt-5 border-t border-dashed border-line-2 pt-4">
            <IconInfo className="text-cobalt shrink-0 mt-0.5" />
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint leading-relaxed">
              No App Store, no upload — OpenMedicine installs straight from this page and keeps every byte of data on
              your machine.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
