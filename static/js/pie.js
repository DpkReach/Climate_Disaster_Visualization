const donutDataUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const width = 600;
const height = 500;
const margin = 40;
const radius = Math.min(width, height) / 2 - margin;

const svg = d3.select("#donut-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("overflow", "visible")
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

const tooltip = d3.select("#donut-chart")
  .append("div")
  .attr("class", "tooltip-donut")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(0,0,0,0.75)")
  .style("color", "white")
  .style("padding", "6px 12px")
  .style("border-radius", "4px")
  .style("font-size", "0.9em")
  .style("pointer-events", "none");

const color = d3.scaleOrdinal(d3.schemeCategory10);

d3.tsv(donutDataUrl).then(data => {
  const total = d3.sum(data, d => d["Disaster Type"] ? 1 : 0);
  const threshold = 0.03; // group types under 3%

  const rawCounts = Array.from(
    d3.rollup(data, v => v.length, d => d["Disaster Type"]),
    ([type, count]) => ({ type, count })
  );

  const typeCounts = [];
  let otherTotal = 0;
  const otherItems = [];

  rawCounts.forEach(d => {
    const percentage = d.count / total;
    if (percentage < threshold) {
      otherTotal += d.count;
      otherItems.push(d.type);
    } else {
      typeCounts.push(d);
    }
  });

  if (otherTotal > 0) {
    typeCounts.push({ type: `Other (${otherItems.join(", ")})`, count: otherTotal });
  }

  const pie = d3.pie()
    .sort(null)
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius);

  const outerArc = d3.arc()
    .innerRadius(radius * 1.05)
    .outerRadius(radius * 1.1);

  const arcs = svg.selectAll(".arc")
    .data(pie(typeCounts))
    .enter()
    .append("g")
    .attr("class", "arc");

  // Draw slices
  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.type))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>${d.data.type.split("(")[0]}</strong><br/>
        ${d.data.count} events<br/>
        ${((d.data.count / total) * 100).toFixed(1)}%
      `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Connector lines
  arcs.append("polyline")
    .attr("stroke", "#333")
    .attr("stroke-width", 1)
    .attr("fill", "none")
    .attr("points", d => {
      const posA = arc.centroid(d);
      const posB = outerArc.centroid(d);
      const posC = [...outerArc.centroid(d)];
      const midAngle = (d.startAngle + d.endAngle) / 2;
      posC[0] = radius * 1.3 * (midAngle < Math.PI ? 1 : -1);
      return [posA, posB, posC];
    });

  // Labels
  arcs.append("text")
    .text(d => {
      const percent = ((d.data.count / total) * 100).toFixed(1);
      return `${d.data.type.split("(")[0]} (${percent}%)`;
    })
    .attr("transform", d => {
      const pos = outerArc.centroid(d);
      const midAngle = (d.startAngle + d.endAngle) / 2;
      pos[0] = radius * 1.35 * (midAngle < Math.PI ? 1 : -1);
      return `translate(${pos})`;
    })
    .style("text-anchor", d => {
      const midAngle = (d.startAngle + d.endAngle) / 2;
      return midAngle < Math.PI ? "start" : "end";
    })
    .style("font-size", "12px")
    .style("fill", "#000");
});
