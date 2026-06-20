import { useState } from "react";
import { X, Lock, MoreVertical, RotateCw } from "lucide-react";

type InAppBrowserProps = {
  url: string;
  onClose: () => void;
};

export function InAppBrowser({ url, onClose }: InAppBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Extract domain for the header lock icon
  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch {
    /* ignore */
  }

  const handleRefresh = () => {
    setLoading(true);
    setError(false);
    const iframe = document.getElementById("in-app-browser-frame") as HTMLIFrameElement;
    if (iframe) {
      // Force iframe reload by reassigning src
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in slide-in-from-bottom-8 duration-300">
      {/* Browser Header (Instagram Style) */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-white/10 shrink-0 h-14">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onClose} className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full active:scale-90 transition-transform">
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 justify-center mr-8">
              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-[13px] font-semibold text-gray-200 truncate">{domain}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleRefresh} className="p-1 text-gray-400 hover:text-white rounded-full">
            <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1 text-gray-400 hover:text-white rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative bg-white">
        {loading && !error && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading page...</p>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-20">
            <Lock className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Connection Blocked</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm">
              This website ({domain}) does not allow itself to be embedded inside other apps for security reasons.
            </p>
            <button 
              onClick={() => window.open(url, "_blank")}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Open in System Browser
            </button>
          </div>
        ) : (
          <iframe
            id="in-app-browser-frame"
            src={url}
            className="w-full h-full border-none bg-white"
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="In-App Browser"
          />
        )}
      </div>
    </div>
  );
}
