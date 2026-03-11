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
  if (type === "Actor") return 28;
  if (type === "Claim" || type === "Interest") return 16;
  return 12;
}

// Node shape path generators
function nodeShape(type: string, r: number): string {
  switch (type) {
    case "Claim": {
      // Diamond
      const d = r * 1.2;
      return `M 0,${-d} L ${d},0 L 0,${d} L ${-d},0 Z`;
    }
    case "Interest": {
      // Pentagon
      const pts = Array.from({ length: 5 }, (_, i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "Constraint": {
      // Hexagon
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 2 * Math.PI) / 6;
        return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "Leverage": {
      // Triangle
      const pts = Array.from({ length: 3 }, (_, i) => {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        return `${r * 1.1 * Math.cos(angle)},${r * 1.1 * Math.sin(angle)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    default:
      return ""; // use circle
  }
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
  const simNodesRef = useRef<GraphNode[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, node: null });
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.attr("width", width).attr("height", height);

    // ── Defs: glow filter + arrowhead markers ──
    svg.select("defs").remove();
    const defs = svg.append("defs");

    const filter = defs.append("filter").attr("id", "bloom").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "4").attr("result", "blur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Animated edge dash marker
    defs.append("style").text(`
      @keyframes dashDraw {
        from { stroke-dashoffset: 100; }
        to { stroke-dashoffset: 0; }
      }
      .edge-new { animation: dashDraw 0.6s ease-out forwards; }
    `);

    // Multiple arrow markers by color
    [["arrow-red", "#ef4444"], ["arrow-green", "#10b981"], ["arrow-gray", "#374151"]].forEach(([id, color]) => {
      defs.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
    });

    simulationRef.current?.stop();

    const simNodes: GraphNode[] = nodes.map((n, i) => {
      const existing = simNodesRef.current.find((s) => s.id === n.id);
      return {
        ...n,
        x: existing?.x ?? n.x ?? width / 2 + Math.cos((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 60,
        y: existing?.y ?? n.y ?? height / 2 + Math.sin((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 60,
      };
    });

    const nodeById = new Map(simNodes.map((n) => [n.id, n]));
    const simEdges: any[] = edges
      .map((e) => ({
        ...e,
        source: nodeById.get(typeof e.source === "string" ? e.source : (e.source as GraphNode).id) ?? e.source,
        target: nodeById.get(typeof e.target === "string" ? e.target : (e.target as GraphNode).id) ?? e.target,
      }))
      .filter((e) => e.source && e.target);

    svg.select("g.root").remove();
    const root = svg.append("g").attr("class", "root");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => root.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // ── Links ──
    const linkSel = root.append("g").attr("class", "links")
      .selectAll<SVGLineElement, any>("line")
      .data(simEdges)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("stroke-dasharray", "100")
            .attr("stroke-dashoffset", "100")
            .call((el) =>
              el.transition().duration(600).attr("stroke-dashoffset", "0"),
            ),
      )
      .attr("stroke", (d) => edgeColor(d.type))
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5)
      .attr("marker-end", (d) => {
        const c = edgeColor(d.type);
        if (c === "#ef4444") return "url(#arrow-red)";
        if (c === "#10b981") return "url(#arrow-green)";
        return "url(#arrow-gray)";
      })
      .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
      .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
      .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
      .attr("y2", (d) => (d.target as GraphNode).y ?? 0)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        setHoveredEdge(d.type + String((d.source as any).id) + String((d.target as any).id));
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", 2.5);
      })
      .on("mouseout", function () {
        setHoveredEdge(null);
        d3.select(this).attr("stroke-opacity", 0.5).attr("stroke-width", 1.5);
      });

    // ── Edge labels — rendered as foreignObject for click-through, shown on hover via React state ──
    // We use a g with text, always present but toggled via opacity
    const linkLabelSel = root.append("g").attr("class", "link-labels")
      .selectAll<SVGTextElement, any>("text")
      .data(simEdges)
      .join("text")
      .attr("font-size", "7px")
      .attr("fill", "#9ca3af")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("opacity", 0) // hidden by default; shown on hover via tick
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
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          }),
      );

    // Add shapes
    nodeSel.each(function (d) {
      const g = d3.select(this);
      const r = nodeRadius(d.type);
      const path = nodeShape(d.type, r);
      const isNew = !prevNodeIdsRef.current.has(d.id);
      const fillOpacity = highlightActorId && d.type !== "Actor" && d.actorId !== highlightActorId ? 0.2 : 0.88;
      const color = NODE_COLORS[d.type] ?? "#64748b";

      if (path) {
        // Shaped node
        const pathEl = g.append("path")
          .attr("d", path)
          .attr("fill", color)
          .attr("fill-opacity", fillOpacity)
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .style("transform-box", "fill-box")
          .style("transform-origin", "center");
        if (isNew) {
          pathEl.attr("filter", "url(#bloom)").style("transform", "scale(0)")
            .transition().duration(600).ease(d3.easeElasticOut)
            .style("transform", "scale(1)").on("end", function () {
              d3.select(this).attr("filter", "none");
            });
        }
      } else {
        // Circle (Actor or Commitment/Event/Narrative)
        const circEl = g.append("circle")
          .attr("r", r)
          .attr("fill", color)
          .attr("fill-opacity", fillOpacity)
          .attr("stroke", color)
          .attr("stroke-width", d.type === "Actor" ? 3 : 2)
          .style("transform-box", "fill-box")
          .style("transform-origin", "center");
        if (isNew) {
          circEl.attr("filter", "url(#bloom)").style("transform", "scale(0)")
            .transition().duration(600).ease(d3.easeElasticOut)
            .style("transform", "scale(1)").on("end", function () {
              d3.select(this).attr("filter", "none");
            });
        }
      }

      // Type letter
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", d.type === "Actor" ? "11px" : "8px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .attr("pointer-events", "none")
        .attr("opacity", fillOpacity)
        .text(d.type[0]);

      // Label below
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", r + 11)
        .attr("font-size", d.type === "Actor" ? "9px" : "7px")
        .attr("fill", "#d1d5db")
        .attr("pointer-events", "none")
        .attr("opacity", fillOpacity)
        .text(d.label.length > 16 ? d.label.slice(0, 16) + "…" : d.label);
    });

    // Tooltips
    nodeSel
      .on("mouseover", (event, d) => {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({ visible: true, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 8, node: d });
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip((prev) => ({ ...prev, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 8 }));
      })
      .on("mouseout", () => setTooltip((prev) => ({ ...prev, visible: false })));

    // ── Simulation ──
    const simulation = d3.forceSimulation<GraphNode>(simNodes)
      .force("link", d3.forceLink<GraphNode, any>(simEdges).id((d) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>((d) => nodeRadius(d.type) + 8))
      .on("tick", () => {
        linkSel
          .attr("x1", (d) => (d.source as any).x ?? 0)
          .attr("y1", (d) => (d.source as any).y ?? 0)
          .attr("x2", (d) => (d.target as any).x ?? 0)
          .attr("y2", (d) => (d.target as any).y ?? 0);

        // Edge labels follow midpoint, shown on hover
        linkLabelSel
          .attr("x", (d) => (((d.source as any).x ?? 0) + ((d.target as any).x ?? 0)) / 2)
          .attr("y", (d) => (((d.source as any).y ?? 0) + ((d.target as any).y ?? 0)) / 2)
          .attr("opacity", (d) => {
            const key = d.type + String((d.source as any).id) + String((d.target as any).id);
            return key === hoveredEdge ? 1 : 0;
          });

        nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);

        // Update mini-map
        updateMiniMap(simNodes, width, height);
      });

    simulationRef.current = simulation;
    simNodesRef.current = simNodes;

    // Auto-fit
    simulation.on("end", () => {
      if (!svgRef.current || simNodes.length === 0) return;
      const xs = simNodes.map((n) => n.x ?? 0);
      const ys = simNodes.map((n) => n.y ?? 0);
      const minX = Math.min(...xs) - 50;
      const maxX = Math.max(...xs) + 50;
      const minY = Math.min(...ys) - 50;
      const maxY = Math.max(...ys) + 50;
      const scaleX = width / (maxX - minX || 1);
      const scaleY = height / (maxY - minY || 1);
      const scale = Math.min(scaleX, scaleY, 2);
      const tx = (width - scale * (minX + maxX)) / 2;
      const ty = (height - scale * (minY + maxY)) / 2;
      svg.transition().duration(800).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    });

    prevNodeIdsRef.current = new Set(nodes.map((n) => n.id));
  }, [nodes, edges, hoveredEdge]);

  // ── Mini-map ──
  const miniMapRef = useRef<SVGSVGElement>(null);
  const MM_W = 120;
  const MM_H = 70;

  function updateMiniMap(simNodes: GraphNode[], fullW: number, fullH: number) {
    if (!miniMapRef.current || simNodes.length === 0) return;
    const mm = d3.select(miniMapRef.current);
    const xs = simNodes.map((n) => n.x ?? 0);
    const ys = simNodes.map((n) => n.y ?? 0);
    const minX = Math.min(...xs) - 20, maxX = Math.max(...xs) + 20;
    const minY = Math.min(...ys) - 20, maxY = Math.max(...ys) + 20;
    const scaleX = MM_W / (maxX - minX || 1);
    const scaleY = MM_H / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    mm.selectAll("circle.mm-node")
      .data(simNodes)
      .join("circle")
      .attr("class", "mm-node")
      .attr("cx", (d) => ((d.x ?? 0) - minX) * scale)
      .attr("cy", (d) => ((d.y ?? 0) - minY) * scale)
      .attr("r", (d) => Math.max(2, nodeRadius(d.type) * scale * 0.5))
      .attr("fill", (d) => NODE_COLORS[d.type] ?? "#64748b")
      .attr("opacity", 0.7);
  }

  useEffect(() => {
    renderGraph();
    return () => { simulationRef.current?.stop(); };
  }, [renderGraph]);

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
        {[
          { label: "+", action: () => svgRef.current && d3.select(svgRef.current).transition().duration(300).call(zoomRef.current!.scaleBy, 1.4) },
          { label: "−", action: () => svgRef.current && d3.select(svgRef.current).transition().duration(300).call(zoomRef.current!.scaleBy, 0.7) },
          { label: "Fit", action: () => svgRef.current && d3.select(svgRef.current).transition().duration(300).call(zoomRef.current!.transform, d3.zoomIdentity) },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="w-7 h-7 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white flex items-center justify-center text-[10px] font-bold"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Mini-map */}
      <div className="absolute top-3 left-3 bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-lg overflow-hidden backdrop-blur-sm">
        <svg ref={miniMapRef} width={MM_W} height={MM_H} className="block" />
      </div>

      {/* Node legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 max-w-[180px]">
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
        <p className="text-[8px] opacity-50 italic">Hover edge for label</p>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="absolute pointer-events-none z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl max-w-[220px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[tooltip.node.type] ?? "#64748b" }} />
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
