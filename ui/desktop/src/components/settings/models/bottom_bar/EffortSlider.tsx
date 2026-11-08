import React from 'react';
import type { ThinkingEffort } from '../../../../types/providers';

interface EffortSliderProps {
  values: ThinkingEffort[];
  value: ThinkingEffort | null;
  onChange: (value: ThinkingEffort) => void;
  title: string;
  labelFor: (value: ThinkingEffort) => string;
}

const THUMB = 24; // px

// Thinking effort as a stepped slider: a green-to-brand-blue track with a
// white thumb. A native range input sits on top (invisible) so dragging,
// clicking and the keyboard all work, and screen readers get a slider.
export function EffortSlider({ values, value, onChange, title, labelFor }: EffortSliderProps) {
  const index = Math.max(0, value ? values.indexOf(value) : 0);
  const fraction = values.length > 1 ? index / (values.length - 1) : 0;
  const current = values[index];
  // The thumb travels over the track minus its own width; the colour runs
  // to the thumb's centre, the rest of the track stays muted.
  const thumbLeft = `calc((100% - ${THUMB}px) * ${fraction})`;
  const restWidth = `calc((100% - ${THUMB}px) * ${1 - fraction} + ${THUMB / 2}px)`;

  return (
    <div
      className="px-2 pt-2 pb-3"
      data-testid="effort-control"
      // Arrow keys belong to the slider here, not to the menu's item navigation.
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-xs text-text-secondary">{title}</span>
        <span className="text-sm font-semibold text-text-primary" data-testid="effort-value">
          {labelFor(current)}
        </span>
      </div>
      <div className="relative h-7">
        <div className="effort-track absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 right-0 bg-background-tertiary transition-[width] duration-150"
            style={{ width: restWidth }}
          />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-black/5 bg-white shadow-md transition-[left] duration-150"
          style={{ left: thumbLeft, width: THUMB, height: THUMB }}
        />
        <input
          type="range"
          min={0}
          max={values.length - 1}
          step={1}
          value={index}
          aria-label={title}
          aria-valuetext={labelFor(current)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(values[Number(event.target.value)])
          }
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
