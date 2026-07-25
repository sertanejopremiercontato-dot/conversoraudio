import React from "react";
import ImageRotateFlipCard, { ImageCardItem } from "./ImageRotateFlipCard";
import { TransformState } from "../../../utils/imageTransformCommands";

interface ImageRotateFlipGridProps {
  items: ImageCardItem[];
  onToggleSelect: (id: string) => void;
  onUpdateTransform: (id: string, newTransform: TransformState) => void;
  onUndo: (id: string) => void;
  onRedo: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenCompare: (item: ImageCardItem) => void;
}

export default function ImageRotateFlipGrid({
  items,
  onToggleSelect,
  onUpdateTransform,
  onUndo,
  onRedo,
  onReset,
  onRemove,
  onOpenCompare
}: ImageRotateFlipGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {items.map((item) => (
        <ImageRotateFlipCard
          key={item.id}
          item={item}
          onToggleSelect={onToggleSelect}
          onUpdateTransform={onUpdateTransform}
          onUndo={onUndo}
          onRedo={onRedo}
          onReset={onReset}
          onRemove={onRemove}
          onOpenCompare={onOpenCompare}
        />
      ))}
    </div>
  );
}
