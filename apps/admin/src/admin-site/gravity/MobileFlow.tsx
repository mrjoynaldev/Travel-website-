"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { BlockView } from "./BlockView";
import { MobileBlockSheet } from "./MobileBlockSheet";
import { flowOrder } from "./serialize";
import { useEditorStore } from "./store";
import type { GravityBlock } from "./types";

function SortableUnit({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        contentVisibility: "auto",
      }}
      className={`relative rounded-xl ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reorder block"
        className="absolute -left-1 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-white/35 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 active:text-white"
        style={{ touchAction: "manipulation" }}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="ml-9">{children}</div>
    </li>
  );
}

function BlockRow({
  block,
  selected,
  onTap,
}: {
  block: GravityBlock;
  selected: boolean;
  onTap: () => void;
}) {
  return (
    <div
      onClick={onTap}
      className={`cursor-pointer rounded-xl transition-shadow ${
        selected ? "ring-2 ring-[#2563eb] ring-offset-2 ring-offset-[#0a0c10]" : ""
      }`}
    >
      <BlockView block={block} selected={selected} fullWidth />
    </div>
  );
}

export function MobileFlow() {
  const blocks = useEditorStore(state => state.blocks);
  const sections = useEditorStore(state => state.sections);
  const selected = useEditorStore(state => state.selected);
  const selectBlock = useEditorStore(state => state.selectBlock);
  const reorderUnits = useEditorStore(state => state.reorderUnits);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 10 } })
  );

  const units = useMemo(() => flowOrder(blocks, sections), [blocks, sections]);
  const unitIds = useMemo(() => units.map(unit => unit.id), [units]);

  if (!units.length) {
    return (
      <div className="grid h-full place-items-center px-6">
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-white">
            Empty story
          </p>
          <p className="mt-1 text-sm text-white/50">
            Tap <span className="font-medium text-white">Add block</span> below to
            start writing in order.
          </p>
        </div>
      </div>
    );
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = unitIds.indexOf(String(active.id));
    const newIndex = unitIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderUnits(arrayMove(unitIds, oldIndex, newIndex));
  };

  const openBlock = (block: GravityBlock) => {
    selectBlock(block.id, false);
    setSheetId(block.id);
  };

  return (
    <div className="h-full overflow-x-hidden overflow-y-auto overscroll-behavior-none">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={unitIds} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3 p-3 pb-6 sm:p-4 sm:pb-8">
            {units.map(unit =>
              unit.kind === "section" ? (
                <SortableUnit key={unit.id} id={unit.id}>
                  <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <p className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-white/50">
                      <Layers className="h-3 w-3" />
                      Section
                    </p>
                    <div className="space-y-3 p-2.5">
                      {unit.blockIds.map(id => {
                        const block = blocks.find(item => item.id === id);
                        if (!block) return null;
                        return (
                          <BlockRow
                            key={id}
                            block={block}
                            selected={selected.includes(id)}
                            onTap={() => openBlock(block)}
                          />
                        );
                      })}
                    </div>
                  </section>
                </SortableUnit>
              ) : (
                (() => {
                  const block = blocks.find(item => item.id === unit.id);
                  if (!block) return null;
                  return (
                    <SortableUnit key={unit.id} id={unit.id}>
                      <BlockRow
                        block={block}
                        selected={selected.includes(block.id)}
                        onTap={() => openBlock(block)}
                      />
                    </SortableUnit>
                  );
                })()
              )
            )}
          </ol>
        </SortableContext>
      </DndContext>
      <MobileBlockSheet blockId={sheetId} onClose={() => setSheetId(null)} />
    </div>
  );
}