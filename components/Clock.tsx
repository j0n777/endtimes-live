import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-right">
            <div className="text-2xl font-bold text-white tracking-widest font-mono">
                {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-[10px] text-tactical-500 tracking-[0.2em] uppercase font-mono">
                {time.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
            </div>
        </div>
    );
};

export default React.memo(Clock);
