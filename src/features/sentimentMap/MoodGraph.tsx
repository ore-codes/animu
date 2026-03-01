import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpisodeSentiment } from "./sentimentApi";

interface MoodGraphProps {
  data: EpisodeSentiment[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EpisodeSentiment;
    return (
      <div className="bg-surface2 border border-white/10 p-3 rounded-lg shadow-xl max-w-[280px]">
        <p className="font-bold text-pink mb-1">Episode {data.episodeNumber}</p>
        <p className="text-sm text-text mb-2">
          <span className="text-muted">Score:</span> {data.score.toFixed(2)}
        </p>
        <p className="text-xs text-muted leading-relaxed">{data.reasoning}</p>
      </div>
    );
  }
  return null;
};

export function MoodGraph({ data }: MoodGraphProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[400px] mt-8 bg-surface2/50 border border-white/5 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h3 className="font-bebas text-2xl tracking-wider text-pink mb-6">Emotional Trajectory</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4b8b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
            <XAxis 
              dataKey="episodeNumber" 
              tick={{ fill: "#6b6f8a", fontSize: 12 }} 
              tickMargin={10}
              stroke="#ffffff12"
            />
            <YAxis 
              domain={[-1, 1]} 
              tick={{ fill: "#6b6f8a", fontSize: 12 }}
              tickFormatter={(val) => val === 1 ? "Wholesome" : val === -1 ? "Dark" : "Neutral"}
              stroke="#ffffff12"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ffffff12" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#ff4b8b" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
