import { useMemo, useState, type KeyboardEvent } from "react";

import {
  NODE_KIND_LABEL,
  RELATIONSHIP_LABEL,
  type CaseRecord,
  type Relationship,
  type RelationshipNode,
} from "@/lib/osint/types";

/**
 * Evidence-linked relationship view.
 *
 * Every edge rendered here is a stored Relationship backed by check IDs from
 * the same case — nothing is drawn because two values happened to appear in
 * one result set. The map is a visualisation of the evidence model, not proof
 * of identity: selecting a node or edge shows the classification, the
 * explanation and the supporting evidence.
 */

const VIEW_W = 760;
const NODE_W = 250;
const NODE_H = 56;
const GAP = 30;
const PAD_Y = 14;

type Side = "left" | "right";
type Selection = { kind: "node"; key: string } | { kind: "edge"; id: string };

function nodeKey(node: RelationshipNode): string {
  return `${node.kind}:${node.label}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface Placed {
  node: RelationshipNode;
  key: string;
  side: Side;
  x: number;
  y: number;
}

export function RelationshipMap({
  record,
  relationships,
}: {
  record: CaseRecord;
  relationships: Relationship[];
}) {
  const [selection, setSelection] = useState<Selection>({
    kind: "edge",
    id: relationships[0]?.id ?? "",
  });

  const { placed, edges, height } = useMemo(() => {
    const sides = new Map<string, Side>();
    const nodes = new Map<string, RelationshipNode>();
    const primaryNode: RelationshipNode = { kind: record.entityType, label: record.normalized };
    const primaryId = nodeKey(primaryNode);

    const offer = (node: RelationshipNode) => {
      const key = nodeKey(node);
      if (!nodes.has(key)) nodes.set(key, node);
      return key;
    };

    for (const rel of relationships) {
      const fromKey = offer(rel.from);
      const toKey = offer(rel.to);
      const a = sides.get(fromKey);
      const b = sides.get(toKey);
      if (a && b && a === b) {
        sides.set(toKey, a === "left" ? "right" : "left");
      } else if (a && !b) {
        sides.set(toKey, a === "left" ? "right" : "left");
      } else if (b && !a) {
        sides.set(fromKey, b === "left" ? "right" : "left");
      } else if (!a && !b) {
        sides.set(fromKey, "left");
        sides.set(toKey, "right");
      }
    }
    if (nodes.has(primaryId)) sides.set(primaryId, "left");

    const referenced = new Set<string>();
    for (const rel of relationships) {
      referenced.add(nodeKey(rel.from));
      referenced.add(nodeKey(rel.to));
    }

    const leftOrder: string[] = [];
    const rightOrder: string[] = [];
    if (nodes.has(primaryId) && referenced.has(primaryId)) leftOrder.push(primaryId);
    for (const key of nodes.keys()) {
      if (key === primaryId && leftOrder.includes(key)) continue;
      if (!referenced.has(key)) continue;
      (sides.get(key) === "left" ? leftOrder : rightOrder).push(key);
    }

    const rowCount = Math.max(leftOrder.length, rightOrder.length, 1);
    const viewHeight = rowCount * NODE_H + (rowCount - 1) * GAP + PAD_Y * 2;
    const leftX = 4;
    const rightX = VIEW_W - 4 - NODE_W;

    const place = (keys: string[], x: number, side: Side): Placed[] => {
      const columnHeight = keys.length * NODE_H + Math.max(0, keys.length - 1) * GAP;
      const startY = (viewHeight - columnHeight) / 2;
      return keys.map((key, index) => ({
        key,
        node: nodes.get(key)!,
        side,
        x,
        y: startY + index * (NODE_H + GAP),
      }));
    };

    const left = place(leftOrder, leftX, "left");
    const right = place(rightOrder, rightX, "right");
    const byKey = new Map<string, Placed>([...left, ...right].map((item) => [item.key, item]));

    const drawn = relationships.flatMap((rel) => {
      const from = byKey.get(nodeKey(rel.from));
      const to = byKey.get(nodeKey(rel.to));
      if (!from || !to) return [];

      let x1: number;
      let x2: number;
      if (from.side === "left" && to.side === "right") {
        x1 = from.x + NODE_W;
        x2 = to.x;
      } else if (from.side === "right" && to.side === "left") {
        x1 = from.x;
        x2 = to.x + NODE_W;
      } else {
        const outer = from.side === "left" ? from.x + NODE_W + 16 : from.x - 16;
        x1 = outer;
        x2 = outer;
      }

      const y1 = from.y + NODE_H / 2;
      const y2 = to.y + NODE_H / 2;
      return [
        {
          rel,
          x1,
          y1,
          x2,
          y2,
          mx: (x1 + x2) / 2,
          my: (y1 + y2) / 2,
          label: truncate(rel.type, 30),
        },
      ];
    });

    return { placed: [...left, ...right], edges: drawn, height: viewHeight };
  }, [record.entityType, record.normalized, relationships]);

  const selectedRel =
    selection.kind === "edge" ? relationships.find((rel) => rel.id === selection.id) : undefined;
  const selectedNode =
    selection.kind === "node" ? placed.find((item) => item.key === selection.key) : undefined;

  const evidenceChecks = (ids: string[]) =>
    ids.map((id) => ({ id, check: record.checks.find((check) => check.id === id) }));

  const activateOnKey = (event: KeyboardEvent, apply: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      apply();
    }
  };

  return (
    <div className="rel-map">
      <div className="rel-svg-wrap">
        <svg
          className="rel-svg"
          viewBox={`0 0 ${VIEW_W} ${height}`}
          role="group"
          aria-label="Evidence-linked relationship map. Select a node or connection to inspect it."
        >
          <defs>
            <marker
              id="rel-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="rel-arrow-head" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const isSelected = selection.kind === "edge" && selection.id === edge.rel.id;
            const labelWidth = edge.label.length * 5.4 + 12;
            return (
              <g
                key={edge.rel.id}
                className={`rel-edge${isSelected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${edge.rel.from.label} — ${edge.rel.type} — ${edge.rel.to.label}. ${RELATIONSHIP_LABEL[edge.rel.classification]}`}
                onClick={() => setSelection({ kind: "edge", id: edge.rel.id })}
                onKeyDown={(event) =>
                  activateOnKey(event, () => setSelection({ kind: "edge", id: edge.rel.id }))
                }
              >
                <line
                  className="rel-edge-line"
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  markerEnd="url(#rel-arrow)"
                />
                <line
                  className="rel-edge-hit"
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                />
                <rect
                  className="rel-edge-label-bg"
                  x={edge.mx - labelWidth / 2}
                  y={edge.my - 17}
                  width={labelWidth}
                  height={15}
                  rx={2}
                />
                <text className="rel-edge-label" x={edge.mx} y={edge.my - 6} textAnchor="middle">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {placed.map((item) => {
            const isSelected = selection.kind === "node" && selection.key === item.key;
            return (
              <g
                key={item.key}
                className={`rel-node${isSelected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${NODE_KIND_LABEL[item.node.kind]}: ${item.node.label}`}
                transform={`translate(${item.x},${item.y})`}
                onClick={() => setSelection({ kind: "node", key: item.key })}
                onKeyDown={(event) =>
                  activateOnKey(event, () => setSelection({ kind: "node", key: item.key }))
                }
              >
                <rect className="rel-node-box" width={NODE_W} height={NODE_H} rx={3} />
                <text className="rel-node-kind" x={13} y={21}>
                  {NODE_KIND_LABEL[item.node.kind].toUpperCase()}
                </text>
                <text className="rel-node-label" x={13} y={41}>
                  {truncate(item.node.label, 31)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rel-detail" role="status">
        {selectedRel ? (
          <>
            <div className="rel-detail-head">
              <span className={`finding-class finding-class--${selectedRel.classification}`}>
                {RELATIONSHIP_LABEL[selectedRel.classification]}
              </span>
              <span className="rel-detail-type">{selectedRel.type}</span>
            </div>
            <p className="check-observation">
              {selectedRel.from.label} → {selectedRel.to.label}
            </p>
            <p className="check-detail">{selectedRel.explanation}</p>
            {selectedRel.limitation ? (
              <p className="finding-limit">{selectedRel.limitation}</p>
            ) : null}
            <p className="check-refs">
              Supported by:{" "}
              {evidenceChecks(selectedRel.evidenceIds).map(({ id, check }, index) => (
                <span key={id}>
                  {index > 0 ? " · " : null}
                  <a href={`#check-${id}`}>{id}</a>
                  {check?.source ? <span className="dim"> ({check.source.name})</span> : null}
                </span>
              ))}
            </p>
          </>
        ) : selectedNode ? (
          <>
            <div className="rel-detail-head">
              <span className="rel-detail-kind">{NODE_KIND_LABEL[selectedNode.node.kind]}</span>
            </div>
            <p className="check-observation">{selectedNode.node.label}</p>
            {selectedNode.node.url ? (
              <p className="check-detail">
                <a href={selectedNode.node.url} target="_blank" rel="noreferrer noopener">
                  {selectedNode.node.url}
                </a>
              </p>
            ) : null}
            <p className="field-hint">
              A node is an entity referenced by this case's evidence. Selecting it does not assert
              identity; inspect each connection for what supports it.
            </p>
          </>
        ) : (
          <p className="field-hint">Select a node or connection to inspect its evidence.</p>
        )}
      </div>

      <ul className="rel-list">
        {relationships.map((rel) => {
          const isSelected = selection.kind === "edge" && selection.id === rel.id;
          return (
            <li key={rel.id}>
              <button
                type="button"
                className={`rel-list-btn${isSelected ? " is-selected" : ""}`}
                aria-pressed={isSelected}
                onClick={() => setSelection({ kind: "edge", id: rel.id })}
              >
                <span className="rel-list-pair">
                  {rel.from.label} → {rel.to.label}
                </span>
                <span className="rel-list-type">{rel.type}</span>
                <span className={`finding-class finding-class--${rel.classification}`}>
                  {RELATIONSHIP_LABEL[rel.classification]}
                </span>
                <span className="check-refs">Supported by: {rel.evidenceIds.join(" · ")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
