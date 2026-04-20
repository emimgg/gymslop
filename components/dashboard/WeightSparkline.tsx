'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightSparklineProps {
  data: { date: string; weight: number }[];
}

export function WeightSparkline({ data }: WeightSparklineProps) {
  const latest = data[data.length - 1]?.weight;

  return (
    <div>
      <p className="text-xl font-bold text-neon-cyan mb-1">
        {latest?.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span>
      </p>
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#00f5ff"
            strokeWidth={2}
            dot={false}
            style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }}
          />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#00f5ff' }}
            formatter={(v: number) => [`${v.toFixed(1)} kg`]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
