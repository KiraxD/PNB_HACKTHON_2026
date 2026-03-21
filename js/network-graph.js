/* ============================================================
   network-graph.js — D3.js Network Graph for Asset Discovery
   ============================================================ */

window.QSR = window.QSR || {};

QSR.renderNetworkGraph = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const width  = container.clientWidth  || 900;
  const height = container.clientHeight || 420;

  // Node data
  const nodes = [
    { id:'pnb.bank.in',           type:'domain',   label:'Domain: pnb.bank.in',          color:'#4299e1' },
    { id:'portal.pnb.bank.in',    type:'domain',   label:'Domain: portal.pnb.bank.in',   color:'#4299e1' },
    { id:'api.pnb.bank.in',       type:'domain',   label:'Domain: api.pnb.bank.in',      color:'#4299e1' },
    { id:'vpn.pnb.bank.in',       type:'domain',   label:'Domain: vpn.pnb.bank.in',      color:'#4299e1' },
    { id:'103.41.66.20',          type:'ip',       label:'IP: 103.41.66.20',            color:'#48bb78' },
    { id:'103.41.66.21',          type:'ip',       label:'IP: 103.41.66.21',            color:'#48bb78' },
    { id:'34.55.90.21',           type:'ip',       label:'IP: 34.55.90.21',             color:'#e53e3e' },
    { id:'SSL:portal',            type:'ssl',      label:'SSL: DigiCert',               color:'#ecc94b' },
    { id:'SSL:api',               type:'ssl',      label:"SSL: Let's Encrypt",          color:'#ecc94b' },
    { id:'SSL:vpn',               type:'ssl',      label:'SSL: COMODO (Expired)',        color:'#e53e3e' },
    { id:'TAG:webapp',            type:'tag',      label:'Tag: Web App',                color:'#805ad5' },
    { id:'TAG:api',               type:'tag',      label:'Tag: API Gateway',            color:'#805ad5' },
    { id:'TAG:vpn',               type:'tag',      label:'Tag: VPN',                   color:'#d69e2e' },
    { id:'TAG:scanning',          type:'tag',      label:'Tag: Scanning IP',            color:'#d69e2e' },
    { id:'payments.pnb.bank.in',  type:'domain',   label:'Domain: payments.pnb.bank.in',color:'#4299e1' },
    { id:'103.41.66.30',          type:'ip',       label:'IP: 103.41.66.30',           color:'#48bb78' },
    { id:'auth.pnb.bank.in',      type:'domain',   label:'Domain: auth.pnb.bank.in',   color:'#4299e1' },
    { id:'103.41.66.35',          type:'ip',       label:'IP: 103.41.66.35',           color:'#48bb78' },
    { id:'WWW:portal',            type:'www',      label:'WWW',                        color:'#38b2ac' },
    { id:'WWW:api',               type:'www',      label:'WWW',                        color:'#38b2ac' },
  ];

  const links = [
    { source:'pnb.bank.in',         target:'portal.pnb.bank.in' },
    { source:'pnb.bank.in',         target:'api.pnb.bank.in' },
    { source:'pnb.bank.in',         target:'vpn.pnb.bank.in' },
    { source:'pnb.bank.in',         target:'payments.pnb.bank.in' },
    { source:'pnb.bank.in',         target:'auth.pnb.bank.in' },
    { source:'portal.pnb.bank.in',  target:'103.41.66.20' },
    { source:'portal.pnb.bank.in',  target:'SSL:portal' },
    { source:'portal.pnb.bank.in',  target:'TAG:webapp' },
    { source:'portal.pnb.bank.in',  target:'WWW:portal' },
    { source:'api.pnb.bank.in',     target:'103.41.66.21' },
    { source:'api.pnb.bank.in',     target:'SSL:api' },
    { source:'api.pnb.bank.in',     target:'TAG:api' },
    { source:'api.pnb.bank.in',     target:'WWW:api' },
    { source:'vpn.pnb.bank.in',     target:'34.55.90.21' },
    { source:'vpn.pnb.bank.in',     target:'SSL:vpn' },
    { source:'vpn.pnb.bank.in',     target:'TAG:vpn' },
    { source:'payments.pnb.bank.in',target:'103.41.66.30' },
    { source:'payments.pnb.bank.in',target:'TAG:webapp' },
    { source:'auth.pnb.bank.in',    target:'103.41.66.35' },
    { source:'auth.pnb.bank.in',    target:'TAG:scanning' },
    { source:'103.41.66.20',        target:'TAG:scanning' },
  ];

  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:10px;color:#4a4a6a;">
      <div style="font-size:32px;">🕸️</div>
      <div style="font-size:15px;font-weight:600;">Network Graph (D3.js)</div>
      <div style="font-size:12px;">Loading network topology...</div>
    </div>`;
    return;
  }

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Background
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'rgba(240,244,255,0.4)').attr('rx', 10);

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(28));

  // Arrow marker
  svg.append('defs').append('marker')
    .attr('id','arrow').attr('viewBox','0 -4 8 8').attr('refX',16).attr('refY',0)
    .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
    .append('path').attr('d','M0,-4L8,0L0,4').attr('fill','#aaa');

  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke','#aab')
    .attr('stroke-width',1.2)
    .attr('stroke-opacity',0.6)
    .attr('marker-end','url(#arrow)');

  const node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end',   (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    )
    .on('mouseover', function(event, d) {
      d3.select(this).select('circle').attr('r', 18).attr('stroke-width', 2.5);
      tooltip.style('display','block').html(`<strong>${d.label}</strong><br><span style="font-size:11px;color:#888;">${d.type.toUpperCase()}</span>`);
    })
    .on('mousemove', function(event) {
      const rect = container.getBoundingClientRect();
      tooltip.style('left', (event.clientX - rect.left + 12) + 'px').style('top', (event.clientY - rect.top + 12) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('circle').attr('r', 14).attr('stroke-width', 1.5);
      tooltip.style('display','none');
    });

  node.append('circle')
    .attr('r', 14)
    .attr('fill', d => d.color)
    .attr('stroke','#fff')
    .attr('stroke-width',1.5)
    .attr('filter','drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

  node.append('text')
    .attr('text-anchor','middle')
    .attr('dy',4)
    .attr('font-size',9)
    .attr('font-family','Exo 2, sans-serif')
    .attr('font-weight','700')
    .attr('fill','#fff')
    .text(d => {
      if (d.type === 'ip')   return 'IP';
      if (d.type === 'ssl')  return 'SSL';
      if (d.type === 'tag')  return 'TAG';
      if (d.type === 'www')  return 'WWW';
      return 'DOM';
    });

  node.append('text')
    .attr('text-anchor','middle')
    .attr('dy',26)
    .attr('font-size',9)
    .attr('font-family','Exo 2, sans-serif')
    .attr('fill','#1a1a2e')
    .text(d => d.id.split('.')[0].substring(0,12));

  // Tooltip
  const tooltip = d3.select(`#${containerId}`)
    .append('div')
    .style('position','absolute')
    .style('background','rgba(26,42,94,0.9)')
    .style('color','#e8eaf6')
    .style('padding','6px 10px')
    .style('border-radius','6px')
    .style('font-size','12px')
    .style('pointer-events','none')
    .style('display','none')
    .style('z-index','100')
    .style('font-family','Exo 2, sans-serif')
    .style('max-width','200px');

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${Math.max(16, Math.min(width-16, d.x))},${Math.max(16, Math.min(height-16, d.y))})`);
  });

  // Legend
  const legend = svg.append('g').attr('transform',`translate(12,12)`);
  const types = [
    { type:'Domain', color:'#4299e1' }, { type:'IP',     color:'#48bb78' },
    { type:'SSL',    color:'#ecc94b' }, { type:'Tag',    color:'#805ad5' },
  ];
  types.forEach((t, i) => {
    legend.append('circle').attr('cx', i*80+8).attr('cy',8).attr('r',7).attr('fill',t.color);
    legend.append('text').attr('x', i*80+20).attr('y',12).attr('font-size',10).attr('fill','#1a1a2e').attr('font-family','Exo 2').text(t.type);
  });
};
