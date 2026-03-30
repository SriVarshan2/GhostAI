import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { PackageAudit } from '../types';
import { wasteLevelLabel } from '../engine/ratio';

interface WasteTreemapProps {
  packages: PackageAudit[];
  onSelect: (pkg: PackageAudit) => void;
  selected?: PackageAudit | null;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  pkg: PackageAudit | null;
}

export const WasteTreemap: React.FC<WasteTreemapProps> = ({ packages, onSelect, selected }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, pkg: null });
  const [dims, setDims] = useState({ width: 800, height: 520 });

  // Responsive: use ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDims({
          width: entry.contentRect.width,
          height: Math.max(400, Math.min(620, entry.contentRect.width * 0.6)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const renderTreemap = useCallback(() => {
    if (!svgRef.current || packages.length === 0) return;
    const { width, height } = dims;

    d3.select(svgRef.current).selectAll('*').remove();

    type LeafDatum = { type: 'leaf' } & PackageAudit;
    type RootDatum = { type: 'root'; children: LeafDatum[] };
    type Datum = RootDatum | LeafDatum;

    const root = d3
      .hierarchy<Datum>({ type: 'root', children: packages.map(p => ({ type: 'leaf', ...p })) } as RootDatum)
      .sum(d => ('gzipBytes' in d ? (d as LeafDatum).gzipBytes : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3.treemap<Datum>()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .padding(2)
      .round(true)(root);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const cell = svg.selectAll<SVGGElement, d3.HierarchyRectangularNode<Datum>>('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => {
        const node = d as unknown as d3.HierarchyRectangularNode<Datum>;
        return `translate(${node.x0},${node.y0})`;
      });

    cell.append('rect')
      .attr('class', 'treemap-rect')
      .attr('width', d => {
        const node = d as unknown as d3.HierarchyRectangularNode<Datum>;
        return Math.max(0, node.x1 - node.x0);
      })
      .attr('height', d => {
        const node = d as unknown as d3.HierarchyRectangularNode<Datum>;
        return Math.max(0, node.y1 - node.y0);
      })
      .attr('fill', d => (d.data as LeafDatum).wasteColor)
      .attr('rx', 4)
      .attr('stroke', d => selected?.name === (d.data as LeafDatum).name ? '#fff' : 'rgba(255,255,255,0.1)')
      .attr('stroke-width', d => selected?.name === (d.data as LeafDatum).name ? 2 : 1)
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .on('click', (_event, d) => {
        onSelect(d.data as unknown as PackageAudit);
      })
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('filter', 'brightness(1.2)');
        setTooltip({ visible: true, x: event.clientX, y: event.clientY, pkg: d.data as unknown as PackageAudit });
      })
      .on('mousemove', (event) => {
        setTooltip(t => ({ ...t, x: event.clientX, y: event.clientY }));
      })
      .on('mouseleave', (event, d) => {
        const isSelected = selected?.name === (d.data as LeafDatum).name;
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr('stroke', isSelected ? '#fff' : 'rgba(255,255,255,0.1)')
          .attr('stroke-width', isSelected ? 2 : 1)
          .attr('filter', 'none');
        setTooltip(t => ({ ...t, visible: false }));
      })
      .transition()
      .duration(800)
      .ease(d3.easeExpOut)
      .delay((_, i) => i * 12)
      .style('opacity', 0.85);

    // Package name text
    cell.append('text')
      .attr('x', 8)
      .attr('y', 20)
      .style('font-size', '13px')
      .style('font-weight', '700')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
      .style('opacity', 0)
      .text(d => {
        const node = d as d3.HierarchyRectangularNode<Datum>;
        const pkg = node.data as LeafDatum;
        const w = node.x1 - node.x0;
        if (w < 40) return '';
        const name = pkg.name;
        const maxChars = Math.floor(w / 8.5);
        return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
      })
      .transition().duration(600).delay((_, i) => i * 12 + 200)
      .style('opacity', 1);

    // Size KB label
    cell.append('text')
      .attr('x', 8)
      .attr('y', 36)
      .style('font-size', '11px')
      .style('fill', 'rgba(255,255,255,0.6)')
      .style('pointer-events', 'none')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('opacity', 0)
      .text(d => {
        const node = d as d3.HierarchyRectangularNode<Datum>;
        const pkg = node.data as LeafDatum;
        const w = node.x1 - node.x0;
        const h = node.y1 - node.y0;
        if (w < 60 || h < 45) return '';
        return `${(pkg.gzipBytes / 1024).toFixed(1)} KB`;
      })
      .transition().duration(600).delay((_, i) => i * 12 + 300)
      .style('opacity', 1);

  }, [packages, dims, onSelect, selected]);

  useEffect(() => {
    renderTreemap();
  }, [renderTreemap]);

  const LEGEND = [
    { color: '#639922', label: 'Efficient' },
    { color: '#EF9F27', label: 'Moderate' },
    { color: '#D85A30', label: 'Wasteful' },
    { color: '#E24B4A', label: 'Critical' },
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      <style>{`
        .treemap-rect {
          transition: filter 0.2s ease;
        }
        .treemap-rect:hover {
          z-index: 10;
        }
        @keyframes shimmer {
          0% { opacity: 0.85; }
          50% { opacity: 0.95; }
          100% { opacity: 0.85; }
        }
        .treemap-rect {
          animation: shimmer 3s infinite ease-in-out;
        }
      `}</style>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-white/10" style={{ background: l.color }} />
            <span className="text-[11px] text-[#666] font-mono uppercase tracking-wider">{l.label}</span>
          </div>
        ))}
        <span className="text-[11px] text-[#444] font-mono ml-auto italic">
          {packages.length} packages tracked · tap to audit
        </span>
      </div>

      <svg ref={svgRef} style={{ display: 'block', width: '100%', borderRadius: '12px', background: '#0a0a0a' }} />

      {/* Floating tooltip */}
      {tooltip.visible && tooltip.pkg && (() => {
        const pkg = tooltip.pkg;
        return (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 16,
              top: tooltip.y + 16,
              zIndex: 9999,
              pointerEvents: 'none',
              background: 'rgba(15, 15, 15, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '240px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <div style={{ fontWeight: 800, color: '#fff', marginBottom: 6, fontSize: 15, letterSpacing: '-0.5px' }}>
              {pkg.name}
              {pkg.version !== 'latest' && <span style={{ color: '#555', fontWeight: 400, marginLeft: 4 }}>v{pkg.version}</span>}
            </div>
            
            <div style={{ height: '1px', background: '#222', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#666', fontSize: 11 }}>FOOTPRINT</span>
              <span style={{ color: '#eee', fontSize: 11, fontWeight: 700 }}>{(pkg.gzipBytes / 1024).toFixed(1)} KB</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#666', fontSize: 11 }}>UTILITY</span>
              <span style={{ color: '#eee', fontSize: 11, fontWeight: 700 }}>
                {pkg.namespaceImport ? '100% (ALL)' : `${pkg.importsUsed.length || (pkg.defaultImport ? 1 : 0)} FN`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#666', fontSize: 11 }}>RATIO</span>
              <span style={{ color: pkg.wasteColor, fontSize: 11, fontWeight: 800 }}>{pkg.utilityRatio.toFixed(1)} KB/FN</span>
            </div>

            <div style={{
              padding: '4px 0', borderTop: '1px solid #222', marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: pkg.wasteColor }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: pkg.wasteColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {wasteLevelLabel(pkg.wasteLevel)}
              </span>
            </div>
            
            {pkg.hasSwap && (
              <div style={{ 
                marginTop: 10, padding: '6px 8px', background: 'rgba(99, 153, 34, 0.1)', 
                border: '1px solid rgba(99, 153, 34, 0.2)', borderRadius: 6,
                color: '#639922', fontSize: 10, fontWeight: 700, textAlign: 'center'
              }}>
                REPLACEMENT RECOMMENDED
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
