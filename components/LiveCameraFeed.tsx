import React from 'react';
import { X, Video } from 'lucide-react';
import { LiveCam } from '../lib/camsData';

interface Props {
    cam: LiveCam | null;
    onClose: () => void;
}

const LiveCameraFeed: React.FC<Props> = ({ cam, onClose }) => {
    if (!cam) return null;

    return (
        <div className="absolute bottom-6 right-6 z-[1000] w-[90%] md:w-[450px] bg-black border border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.5)] rounded-sm overflow-hidden flex flex-col">
            <div className="bg-[#0a0f0d] border-b border-emerald-900/50 p-2 flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Video className="w-4 h-4 animate-pulse" />
                    <span className="font-mono text-sm font-bold uppercase tracking-wider">SECURE FEED // {cam.name} // {cam.location}</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="relative pt-[56.25%] w-full bg-black">
                <iframe
                    src={cam.embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default React.memo(LiveCameraFeed);
