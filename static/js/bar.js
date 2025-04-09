import { loadClimateData } from './loadData.js';
// Metric selector and chart container
//const barDataUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const metricSelect = d3.select("#barMetric");
const chartContainer = d3.select("#bar-chart");

const margin = { top: 50, right: 40, bottom: 50, left: 100 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// SVG
const svg = chartContainer
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = chartContainer
  .append("div")
  .attr("class", "tooltip-bar")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(0,0,0,0.75)")
  .style("color", "white")
  .style("padding", "6px 12px")
  .style("border-radius", "4px")
  .style("font-size", "0.9em")
  .style("pointer-events", "none");

let fullData;

function updateBarChart(metric) {
  const top10 = Array.from(
    d3.rollup(
      fullData,
      v => d3.sum(v, d => +d[metric] || 0),
      d => d.Country
    ),
    ([country, value]) => ({ country, value })
  )
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const x = d3.scaleLinear()
    .domain([0, d3.max(top10, d => d.value)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(top10.map(d => d.country))
    .range([0, height])
    .padding(0.2);

  svg.selectAll("*").remove();

  svg.append("g")
    .selectAll("rect")
    .data(top10)
    .enter()
    .append("rect")
    .attr("y", d => y(d.country))
    .attr("width", d => x(d.value))
    .attr("height", y.bandwidth())
    .attr("fill", "#5B9BD5")
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.country}</strong><br>${metric}: ${Math.round(d.value).toLocaleString()}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
      d3.select(this).attr("fill", "#ED7D31");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(300).style("opacity", 0);
      d3.select(this).attr("fill", "#5B9BD5");
    });

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .append("text")
    .attr("x", width)
    .attr("y", 40)
    .attr("text-anchor", "end")
    .attr("fill", "#000")
    .text(metric);
}

// Load data
loadClimateData().then(data => {
  fullData = data;
const defaultMetric = metricSelect.property("value");
  updateBarChart(defaultMetric);

  metricSelect.on("change", function () {
    const selected = d3.select(this).property("value");
    updateBarChart(selected);
  });
});
