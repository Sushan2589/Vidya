"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface TimelineItem {
  id: number;
  year: string;
  title: string;
  order: number;
}

interface SortableRowProps {
  item: TimelineItem;
}

function SortableRow({ item }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-[#ddddd6] rounded-md px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#16324F]/50 hover:text-[#16324F]"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>
      <span className="text-sm text-[#16324F]/60 w-16 shrink-0">{item.year}</span>
      <span className="text-sm text-[#16324F] flex-1 truncate">{item.title}</span>
    </div>
  );
}

interface TimelineAdminListProps {
  initialItems: TimelineItem[];
}

export default function TimelineAdminList({ initialItems }: TimelineAdminListProps) {
  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    const previousItems = items;
    setItems(reordered); // optimistic
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/timeline/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      setError("Couldn't save new order — reverting.");
      setItems(previousItems);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#16324F]/70">
          Existing entries ({items.length}) — drag to reorder
        </h2>
        {saving && <span className="text-xs text-[#16324F]/50">Saving…</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((item) => (
              <SortableRow key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}