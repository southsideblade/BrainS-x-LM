'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphViewProps {
  data: {
    nodes: Array<{
      id: string;
      label: string;
      group?: string;
      size?: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      weight: number;
    }>;
  };
  onNodeClick?: (node: any) => void;
  height?: number | string;
}

export default function GraphView({ data, onNodeClick, height = 600 }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const heightValue = typeof height === 'string' ? container.clientHeight : height;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', heightValue);

    // 색상 스케일
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // 크기 스케일
    const sizeScale = d3.scaleLinear()
      .domain([0.8, 2])
      .range([8, 20]);

    // 시뮬레이션 설정
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.edges as any)
        .id((d: any) => d.id)
        .distance((d: any) => 150 * (1 - d.weight)))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, heightValue / 2))
      .force('collision', d3.forceCollide().radius((d: any) => sizeScale(d.size || 1) + 5));

    // 화살표 마커 정의
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // 컨테이너 그룹
    const g = svg.append('g');

    // 줌 기능 추가
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 링크 그리기
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('class', 'graph-link')
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight * 3))
      .attr('stroke', '#999')
      .attr('stroke-opacity', (d: any) => 0.3 + d.weight * 0.5)
      .attr('marker-end', 'url(#arrow)');

    // 노드 그룹
    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'graph-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // 노드 원
    nodeGroup.append('circle')
      .attr('r', (d: any) => sizeScale(d.size || 1))
      .attr('fill', (d: any) => colorScale(d.group || 'default'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .on('mouseover', function(event, d: any) {
        // 호버 시 강조
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.size || 1) + 3)
          .attr('stroke', '#6366f1')
          .attr('stroke-width', 3);
        
        // 연결된 링크 강조
        link
          .style('stroke', (l: any) => {
            if (l.source.id === d.id || l.target.id === d.id) {
              return '#6366f1';
            }
            return '#999';
          })
          .style('stroke-opacity', (l: any) => {
            if (l.source.id === d.id || l.target.id === d.id) {
              return 1;
            }
            return 0.1;
          });
      })
      .on('mouseout', function(event, d: any) {
        // 호버 해제
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.size || 1))
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
        
        link
          .style('stroke', '#999')
          .style('stroke-opacity', (l: any) => 0.3 + l.weight * 0.5);
      });

    // 노드 레이블
    nodeGroup.append('text')
      .text((d: any) => d.label)
      .attr('x', 0)
      .attr('y', (d: any) => sizeScale(d.size || 1) + 15)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('fill', '#333');

    // 시뮬레이션 업데이트
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 드래그 함수들
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 초기 줌 레벨 설정
    const initialScale = 0.9;
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity
        .translate(width * 0.05, heightValue * 0.05)
        .scale(initialScale)
    );

    // 클린업
    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick, height]);

  return (
    <div ref={containerRef} className="graph-container w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}
