'use client'

import { useState } from 'react'

interface AnalyticsChartProps {
  data: { date: string; pageViews: number; totalEvents: number }[]
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0 || data.every((d) => d.totalEvents === 0)) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No analytics data yet
      </div>
    )
  }

  const chartHeight = 200
  const chartPadding = { top: 20, right: 12, bottom: 40, left: 48 }
  const barGap = 1

  const maxValue = Math.max(...data.map((d) => d.totalEvents), 1)
  const barAreaWidth = 100 // percentage-based, will use viewBox
  const viewBoxWidth = data.length * 16 + chartPadding.left + chartPadding.right
  const viewBoxHeight = chartHeight + chartPadding.top + chartPadding.bottom

  const barWidth = Math.max(
    (viewBoxWidth - chartPadding.left - chartPadding.right) / data.length - barGap,
    2
  )

  // Gridline values (4 lines)
  const gridLines = Array.from({ length: 4 }, (_, i) =>
    Math.round((maxValue / 4) * (i + 1))
  )

  // Show every Nth date label to avoid overlap
  const labelInterval = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 10

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full"
        style={{ height: '250px' }}
        role="img"
        aria-label="Analytics time series bar chart"
      >
        {/* Gridlines */}
        {gridLines.map((val) => {
          const y =
            chartPadding.top +
            chartHeight -
            (val / maxValue) * chartHeight
          return (
            <g key={`grid-${val}`}>
              <line
                x1={chartPadding.left}
                x2={viewBoxWidth - chartPadding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={0.5}
              />
              <text
                x={chartPadding.left - 6}
                y={y + 1.5}
                textAnchor="end"
                fontSize={Math.min(8, viewBoxWidth / 60)}
                fill="currentColor"
                fillOpacity={0.5}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Baseline */}
        <line
          x1={chartPadding.left}
          x2={viewBoxWidth - chartPadding.right}
          y1={chartPadding.top + chartHeight}
          y2={chartPadding.top + chartHeight}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={0.5}
        />

        {/* Bars */}
        {data.map((point, i) => {
          const barHeight = (point.totalEvents / maxValue) * chartHeight
          const x = chartPadding.left + i * (barWidth + barGap)
          const y = chartPadding.top + chartHeight - barHeight

          return (
            <g key={point.date}>
              {/* Invisible wider hit area for hover */}
              <rect
                x={x - barGap}
                y={chartPadding.top}
                width={barWidth + barGap * 2}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visible bar */}
              <rect
                x={x}
                y={barHeight > 0 ? y : chartPadding.top + chartHeight - 1}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={1}
                className={
                  hoveredIndex === i
                    ? 'fill-primary/80'
                    : 'fill-primary/60'
                }
              />

              {/* Date label */}
              {i % labelInterval === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartPadding.top + chartHeight + 14}
                  textAnchor="middle"
                  fontSize={Math.min(7, viewBoxWidth / 70)}
                  fill="currentColor"
                  fillOpacity={0.5}
                >
                  {point.date.slice(5)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="pointer-events-none absolute rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md border"
          style={{
            left: `${((hoveredIndex + 0.5) / data.length) * 100}%`,
            top: '8px',
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-medium">{data[hoveredIndex].date}</p>
          <p>
            {data[hoveredIndex].totalEvents} event
            {data[hoveredIndex].totalEvents !== 1 ? 's' : ''}
          </p>
          <p className="text-muted-foreground">
            {data[hoveredIndex].pageViews} page view
            {data[hoveredIndex].pageViews !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
