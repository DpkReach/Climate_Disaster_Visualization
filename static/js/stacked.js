const csvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const margin = { top: 80, right: 30, bottom: 60, left: 120 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#heatmap")
  .append("div")
  .attr("class", "tooltip-heatmap")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.85)")
  .style("color", "#fff")
  .style("padding", "6px 12px")
  .style("border-radius", "4px")
  .style("font-size", "13px")
  .style("pointer-events", "none");

d3.tsv(csvUrl).then(data => {
  // Prep
  const types = Array.from(new Set(data.map(d => d["Disaster Type"]))).sort();
  const years = Array.from(new Set(data.map(d => +d.Year))).sort();

  // Aggregate data
  const counts = Array.from(
    d3.rollup(data, v => d3.sum(v, d => +d["Total Events"]),
      d => d["Disaster Type"],
      d => +d.Year
    ),
    ([type, yearMap]) =>
      Array.from(yearMap, ([year, count]) => ({ type, year, count }))
  ).flat();

  const x = d3.scaleBand().domain(years).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(types).range([0, height]).padding(0.05);

  const color = d3.scaleSequential()
    .interpolator(d3.interpolateOrRd)
    .domain([0, d3.max(counts, d => d.count)]);

  svg.append("g")
    .selectAll("rect")
    .data(counts)
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.type))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.count))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip
        .html(`<strong>${d.type}</strong><br>Year: ${d.year}<br>Events: ${d.count}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(years.filter((d, i) => i % 2 === 0)).tickFormat(d3.format("d")));

  svg.append("g").call(d3.axisLeft(y));

  // Add color scale legend
  const legendWidth = 200;
  const legendHeight = 10;

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient").attr("id", "legend-gradient");
  gradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter()
    .append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => color(d * color.domain()[1]));

  svg.append("rect")
    .attr("x", width - legendWidth - 10)
    .attr("y", -40)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  svg.append("text")
    .attr("x", width - legendWidth - 10)
    .attr("y", -45)
    .attr("fill", "#333")
    .text("Event Count");

  svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 10}, -30)`)
    .call(d3.axisBottom(d3.scaleLinear()
      .domain(color.domain())
      .range([0, legendWidth])
    ).ticks(5).tickSize(0))
    .select(".domain").remove();
});
