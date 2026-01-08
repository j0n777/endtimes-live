import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { name: 'Jan', tension: 30, signs: 20 },
  { name: 'Feb', tension: 45, signs: 25 },
  { name: 'Mar', tension: 40, signs: 30 },
  { name: 'Apr', tension: 60, signs: 45 },
  { name: 'May', tension: 55, signs: 50 },
  { name: 'Jun', tension: 85, signs: 70 },
  { name: 'Jul', tension: 90, signs: 85 },
];

const ProphecyTimeline: React.FC = () => {
  return (
    <div className="h-64 w-full bg-tactical-800 border border-tactical-700 rounded-lg p-4">
       <h3 className="text-sm font-mono text-tactical-500 mb-4 border-b border-tactical-700 pb-2">
         ESCHATOLOGICAL_TENSION_INDEX (ETI)
       </h3>
       <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{fontFamily: 'monospace'}} />
          <YAxis stroke="#9ca3af" fontSize={12} tick={{fontFamily: 'monospace'}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0f0d', borderColor: '#34d399', color: '#fff' }}
            itemStyle={{ color: '#34d399', fontFamily: 'monospace' }}
          />
          <Line type="monotone" dataKey="tension" stroke="#ef4444" strokeWidth={2} dot={{r: 4, fill: '#ef4444'}} name="Global Tension" />
          <Line type="monotone" dataKey="signs" stroke="#34d399" strokeWidth={2} dot={{r: 4, fill: '#34d399'}} name="Prophetic Signs" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProphecyTimeline;
