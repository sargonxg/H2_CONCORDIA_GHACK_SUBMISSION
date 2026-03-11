"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphEdge, PrimitiveType, EdgeType } from "@/lib/types";

// ── Colors per node type ──
const NODE_COLORS: Record<string, string> = {
  Actor: "#64748b",      // slate
  Claim: "#3b82f6",     // blue
  Interest: "#f43f5e",  // rose
  Constraint: "#f59e0b", // amber
  Leverage: "#eab308",  // yellow
  Commitment: "#10b981", // emerald
  Event: "#a855f7",     // purple
  Narrative: "#8b5cf6", // violet
};

// ── Edge colors by relationship ──
function edgeColor(type: EdgeType): string {
  if (type === "OPPOSES" || type === "CONFLICTS_WITH" || type === "BLOCKS" || type === "CONTRADICTS")
    return "#ef4444";
  if (type === "ALIGNS_WITH" || type === "ADDRESSES")
    return "#10b981";
  return "#374151";
}

function nodeRadius(type: string): number {
  if (type === "Actor") return 22;
  if (type === "Claim" || type === "Interest") return 14;
  return 11;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightActorId?: string | null;
}

export default function ConflictGraph({ nodes, edges, highlightActorId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, node: null });

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.attr("width", width).attr("height", height);

    // ── Defs: glow filter + arrowhead marker ──
    svg.select("defs").remove();
    const defs = svg.append("defs");

    const filter = defs.append("filter").attr("id", "bloom").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "4").attr("result", "blur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#374151");

    // Stop old simulation
    simulationRef.current?.stop();

    // Deep-clone nodes/edges so D3 can mutate them.
    // Pre-initialise x/y so SVG attributes are never "undefined" before the
    // first simulation tick fires (fixes "<line> attribute x2: Expected length, 'undefined'").
    const simNodes: GraphNode[] = nodes.map((n, i) => ({
      ...n,
      x: n.x ?? width / 2 + Math.cos((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 60,
      y: n.y ?? height / 2 + Math.sin((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 60,
    }));
    const nodeById = new Map(simNodes.map((n) => [n.id, n]));
    const simEdges: any[] = edges
      .map((e) => ({
        ...e,
        source: nodeById.get(typeof e.source === "string" ? e.source : (e.source as GraphNode).id) ?? e.source,
        target: nodeById.get(typeof e.target === "string" ? e.target : (e.target as GraphNode).id) ?? e.target,
      }))
      .filter((e) => e.source && e.target);

    // ── Root group (zoomable) ──
    svg.select("g.root").remove();
    const root = svg.append("g").attr("class", "root");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => root.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // ── Links ──
    const linkSel = root.append("g").attr("class", "links")
      .selectAll<SVGLineElement, any>("line")
      .data(simEdges)
      .join("line")
      .attr("stroke", (d) => edgeColor(d.type))
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.55)
      .attr("marker-end", "url(#arrow)")
      // Set initial coordinates from pre-initialised positions so SVG
      // never renders with undefined/empty length attributes.
      .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
      .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
      .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
      .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

    // ── Link labels ──
    const linkLabelSel = root.append("g").attr("class", "link-labels")
      .selectAll<SVGTextElement, any>("text")
      .data(simEdges)
      .join("text")
      .attr("font-size", "7px")
      .attr("fill", "#6b7280")
      .attr("text-anchor", "middle")
      .text((d) => d.type.replace(/_/g, " "));

    // ── Node groups ──
    const nodeSel = root.append("g").attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(simNodes, (d) => d.id)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Circles with BLOOM on new nodes
    nodeSel.append("circle")
      .attr("r", (d) => nodeRadius(d.type))
      .attr("fill", (d) => NODE_COLORS[d.type] ?? "#64748b")
      .attr("fill-opacity", (d) => highlightActorId && d.type !== "Actor" && d.actorId !== highlightActorId ? 0.2 : 0.85)
      .attr("stroke", (d) => NODE_COLORS[d.type] ?? "#64748b")
      .attr("stroke-width", 2)
      .attr("filter", (d) => !prevNodeIdsRef.current.has(d.id) ? "url(#bloom)" : "none")
      .style("transform-box", "fill-box")
      .style("transform-origin", "center")
      .each(function (d) {
        if (!prevNodeIdsRef.current.has(d.id)) {
          d3.select(this)
            .style("transform", "scale(0)")
            .transition()
            .duration(600)
            .ease(d3.easeElasticOut)
            .style("transform", "scale(1)")
            .on("end", function () {
              d3.select(this).attr("filter", "none");
            });
        }
      });

    // Type icon text (first letter)
    nodeSel.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d) => d.type === "Actor" ? "10px" : "8px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .attr("opacity", (d) => highlightActorId && d.type !== "Actor" && d.actorId !== highlightActorId ? 0.2 : 1)
      .text((d) => d.type[0]);

    // Label below node
    nodeSel.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d.type) + 10)
      .attr("font-size", "8px")
      .attr("fill", "#d1d5db")
      .attr("pointer-events", "none")
      .attr("opacity", (d) => highlightActorId && d.type !== "Actor" && d.actorId !== highlightActorId ? 0.2 : 1)
      .text((d) => d.label.length > 14 ? d.label.slice(0, 14) + "…" : d.label);

    // Tooltip events
    nodeSel
      .on("mouseover", (event, d) => {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 8,
          node: d,
        });
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip((prev) => ({ ...prev, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 8 }));
      })
      .on("mouseout", () => setTooltip((prev) => ({ ...prev, visible: false })));

    // ── Simulation ──
    const simulation = d3.forceSimulation<GraphNode>(simNodes)
      .force("link", d3.forceLink<GraphNode, any>(simEdges).id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>(30))
      .on("tick", () => {
        linkSel
          .attr("x1", (d) => (d.source as any).x ?? 0)
          .attr("y1", (d) => (d.source as any).y ?? 0)
          .attr("x2", (d) => (d.target as any).x ?? 0)
          .attr("y2", (d) => (d.target as any).y ?? 0);

        linkLabelSel
          .attr("x", (d) => (((d.source as any).x ?? 0) + ((d.target as any).x ?? 0)) / 2)
          .attr("y", (d) => (((d.source as any).y ?? 0) + ((d.target as any).y ?? 0)) / 2);

        nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simulationRef.current = simulation;

    // Auto-fit after stabilisation
    simulation.on("end", () => {
      if (!svgRef.current || simNodes.length === 0) return;
      const xs = simNodes.map((n) => n.x ?? 0);
      const ys = simNodes.map((n) => n.y ?? 0);
      const minX = Math.min(...xs) - 40;
      const maxX = Math.max(...xs) + 40;
      const minY = Math.min(...ys) - 40;
      const maxY = Math.max(...ys) + 40;
      const scaleX = width / (maxX - minX || 1);
      const scaleY = height / (maxY - minY || 1);
      const scale = Math.min(scaleX, scaleY, 2);
      const tx = (width - scale * (minX + maxX)) / 2;
      const ty = (height - scale * (minY + maxY)) / 2;
      svg.transition().duration(800).call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
    });

    // Update prev ids
    prevNodeIdsRef.current = new Set(nodes.map((n) => n.id));
  }, [nodes, edges]);

  useEffect(() => {
    renderGraph();
    return () => { simulationRef.current?.stop(); };
  }, [renderGraph]);

  // Re-render on resize
  useEffect(() => {
    const ro = new ResizeObserver(() => renderGraph());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [renderGraph]);

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
        <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 opacity-20">
          <circle cx="12" cy="24" r="8" fill="#64748b" />
          <circle cx="36" cy="12" r="6" fill="#3b82f6" />
          <circle cx="36" cy="36" r="6" fill="#f43f5e" />
          <line x1="18" y1="21" x2="31" y2="15" stroke="#374151" strokeWidth="1.5" />
          <line x1="18" y1="27" x2="31" y2="33" stroke="#374151" strokeWidth="1.5" />
        </svg>
        <p className="text-sm font-medium">No graph data yet</p>
        <p className="text-xs mt-1 opacity-60">Start a session or add primitives to see the conflict graph</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full min-h-0">
      <svg ref={svgRef} className="w-full h-full bg-[var(--color-bg)] rounded-xl" />

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4);
          }}
          className="w-7 h-7 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white flex items-center justify-center text-sm font-bold"
          title="Zoom in"
        >+</button>
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
          }}
          className="w-7 h-7 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white flex items-center justify-center text-sm font-bold"
          title="Zoom out"
        >−</button>
        <button
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
          }}
          className="w-7 h-7 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white flex items-center justify-center text-[9px] font-medium"
          title="Fit all"
        >Fit</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-xs">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-[9px] text-[var(--color-text-muted)]">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
            {type}
          </div>
        ))}
      </div>

      {/* Edge legend */}
      <div className="absolute bottom-3 right-3 space-y-0.5 text-[9px] text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1"><span className="w-4 h-px bg-emerald-500 inline-block" /> Alignment</div>
        <div className="flex items-center gap-1"><span className="w-4 h-px bg-red-500 inline-block" /> Opposition</div>
        <div className="flex items-center gap-1"><span className="w-4 h-px bg-[#374151] inline-block" /> Relation</div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="absolute pointer-events-none z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl max-w-[220px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[tooltip.node.type] ?? "#64748b" }}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              {tooltip.node.type}
            </span>
          </div>
          <p className="text-xs text-white leading-relaxed">{tooltip.node.description ?? tooltip.node.label}</p>
        </div>
      )}
    </div>
  );
}
