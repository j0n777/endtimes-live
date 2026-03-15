import React, { useState, useEffect, useRef } from 'react';
import { X, Video, ExternalLink, GripVertical } from 'lucide-react';
import { LiveCam } from '../lib/camsData';
import { useLocale } from '../lib/i18n';

interface Props {
    cam: LiveCam | null;
    onClose: () => void;
}

const LiveCameraFeed: React.FC<Props> = ({ cam, onClose }) => {
    const { t } = useLocale();
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
    const initialized = useRef(false);

    // Set initial position (bottom-right) when cam opens
    useEffect(() => {
        if (cam && !initialized.current) {
            setPos({
                x: window.innerWidth - 470,
                y: window.innerHeight - 330,
            });
            initialized.current = true;
        }
        if (!cam) {
            initialized.current = false;
        }
    }, [cam]);

    // Mouse drag handlers
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: pos.x, posY: pos.y };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const dx = e.clientX - dragStart.current.mouseX;
            const dy = e.clientY - dragStart.current.mouseY;
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 460, dragStart.current.posX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.posY + dy)),
            });
        };
        const onMouseUp = () => setDragging(false);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging]);

    // Touch drag handlers
    const onTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setDragging(true);
        dragStart.current = { mouseX: touch.clientX, mouseY: touch.clientY, posX: pos.x, posY: pos.y };
    };

    useEffect(() => {
        const onTouchMove = (e: TouchEvent) => {
            if (!dragging) return;
            const touch = e.touches[0];
            const dx = touch.clientX - dragStart.current.mouseX;
            const dy = touch.clientY - dragStart.current.mouseY;
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 460, dragStart.current.posX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.posY + dy)),
            });
        };
        const onTouchEnd = () => setDragging(false);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
        return () => {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [dragging]);

    if (!cam) return null;

    // Build a proper YouTube channel live URL from the embed URL's channel= param
    const channelId = cam.embedUrl.match(/channel=([^&]+)/)?.[1];
    const externalUrl = channelId
        ? `https://www.youtube.com/channel/${channelId}/live`
        : (cam as any).url || cam.embedUrl;

    return (
        <div
            className="fixed z-[1000] w-[90vw] md:w-[450px] bg-black border border-emerald-800 shadow-lg rounded-sm overflow-hidden flex flex-col select-none"
            style={{ left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'default' }}
        >
            {/* Header — drag handle */}
            <div
                className="bg-[#0a0f0d] border-b border-emerald-900/50 p-2 flex justify-between items-center cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <div className="flex items-center gap-2 text-emerald-500 overflow-hidden">
                    <GripVertical className="w-4 h-4 shrink-0 text-emerald-700" />
                    <Video className="w-4 h-4 shrink-0 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider truncate">
                        {t.map.securePrefix} // {cam.name} // {cam.location}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {externalUrl && (
                        <a
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-emerald-400 hover:text-white border border-emerald-800 hover:border-emerald-500 transition-colors rounded-sm"
                            title="Open stream on YouTube"
                        >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">{t.map.open}</span>
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer p-0.5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Video embed */}
            <div className="relative pt-[56.25%] w-full bg-black">
                <iframe
                    src={cam.embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default React.memo(LiveCameraFeed);
