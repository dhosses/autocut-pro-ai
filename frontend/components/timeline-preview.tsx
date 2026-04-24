"use client";

interface Segment {
  start: number;
  end: number;
  type: "keep" | "cut";
  label?: string;
}

interface TimelinePreviewProps {
  segments: Segment[];
  totalDuration: number;
}

export default function TimelinePreview({ segments, totalDuration }: TimelinePreviewProps) {
  if (!segments.length || totalDuration === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 text-gray-500 text-sm text-center">
        Timeline will appear after processing
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-400">Timeline</h3>
      <div className="relative h-10 bg-gray-800 rounded-lg overflow-hidden">
        {segments.map((seg, i) => {
          const left = (seg.start / totalDuration) * 100;
          const width = ((seg.end - seg.start) / totalDuration) * 100;
          return (
            <div
              key={i}
              className={`absolute top-0 h-full transition-all ${
                seg.type === "keep" ? "bg-brand-500" : "bg-gray-700"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={seg.label || (seg.type === "keep" ? "Keep" : "Cut")}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0:00</span>
        <span>{Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, "0")}</span>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" /> Keep
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" /> Cut
        </span>
      </div>
    </div>
  );
}
