import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { NOTE_COLORS } from "../utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export default function ColorPicker({
  value,
  onChange,
  className,
}: ColorPickerProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      data-ocid="color_picker.panel"
    >
      {NOTE_COLORS.map((c) => (
        <button
          type="button"
          key={c.name}
          title={c.label}
          onClick={() => onChange(c.name)}
          className="relative w-7 h-7 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
          style={{
            backgroundColor: c.hex,
            borderColor: value === c.name ? "#1a1a1a" : "transparent",
          }}
          data-ocid={`color_picker.${c.name}.toggle`}
        >
          {value === c.name && (
            <Check
              size={12}
              className="absolute inset-0 m-auto text-gray-900"
              strokeWidth={3}
            />
          )}
        </button>
      ))}
    </div>
  );
}
