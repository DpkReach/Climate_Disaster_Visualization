import { loadClimateData } from './loadData.js';

const metricSelect = d3.select("#barMetric");
const chartContainer = d3.select("#bar-chart");

const margin = { top: 30, right: 30, bottom: 60, left: 90 };
const containerWidth = chartContainer.node().clientWidth;
const containerHeight = window.innerHeight * 0.6;

const width = containerWidth - margin.left - margin.right;
const height = containerHeight - margin.top - margin.bottom;

const svg = chartContainer
  .append("svg")
  .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("width", "100%")
  .style("height", "auto")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

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

let fullData = [];

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
    .on("mousemove", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.country}</strong><br>${metric}: ${Math.round(d.value).toLocaleString()}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`);
      d3.select(this).attr("fill", "#ED7D31");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(300).style("opacity", 0);
      d3.select(this).attr("fill", "#5B9BD5");
    });

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));
}

loadClimateData().then(data => {
  fullData = data;
  const defaultMetric = metricSelect.property("value");
  updateBarChart(defaultMetric);

  metricSelect.on("change", function () {
    const selected = d3.select(this).property("value");
    updateBarChart(selected);
  });
});
