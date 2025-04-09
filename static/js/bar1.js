import { loadClimateData } from './loadData.js';

const margin = { top: 40, right: 30, bottom: 100, left: 80 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#bar-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#bar-chart")
  .append("div")
  .attr("class", "tooltip-d")
  .style("position", "absolute")
  .style("background", "rgba(0,0,0,0.7)")
  .style("color", "white")
  .style("padding", "6px 12px")
  .style("border-radius", "4px")
  .style("font-size", "0.9em")
  .style("pointer-events", "none")
  .style("visibility", "hidden");

//const barDataUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

//d3.tsv(barDataUrl).then(data => {

loadClimateData().then(data => {
  // Clean data
  data.forEach(d => {
    d["Total Deaths"] = +d["Total Deaths"] || 0;
    d["Total Events"] = +d["Total Events"] || 0;
    d["Total Damage (USD, adjusted)"] = +d["Total Damage (USD, adjusted)"] || 0;
  });

  const metricSelect = document.getElementById("barMetric") || createDropdown();

  function updateChart(metric) {
    svg.selectAll("*").remove();

    const aggregated = Array.from(
      d3.rollup(
        data,
        v => d3.sum(v, d => d[metric]),
        d => d["Disaster Type"]
      ),
      ([type, value]) => ({ type, value })
    ).filter(d => d.value > 0);

    const top10 = aggregated.sort((a, b) => b.value - a.value).slice(0, 10);

    const x = d3.scaleBand()
      .domain(top10.map(d => d.type))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(top10, d => d.value)])
      .nice()
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y));

    svg.selectAll(".bar")
      .data(top10)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.type))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value))
      .attr("fill", "#1abc9c")
      .on("mousemove", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .style("top", (event.pageY - 40) + "px")
          .style("left", (event.pageX + 20) + "px")
          .html(`<strong>${d.type}</strong><br/>${metric}: ${Math.round(d.value).toLocaleString()}`);
      })
      .on("mouseout", () => {
        tooltip.style("position", "absolute");
      });
  }

  // Initialize chart
  updateChart("Total Deaths");

  // Dropdown listener
  metricSelect.addEventListener("change", function () {
    updateChart(this.value);
  });
});

// Optional: Add dropdown if not already in HTML
function createDropdown() {
  const label = document.createElement("label");
  label.textContent = "Select Metric:";
  label.style.display = "block";
  label.style.marginBottom = "0.5em";
  label.style.fontWeight = "bold";

  const select = document.createElement("select");
  select.id = "barMetric";
  select.style.marginBottom = "1em";

  ["Total Deaths", "Total Events", "Total Damage (USD, adjusted)"].forEach(metric => {
    const option = document.createElement("option");
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });

  const container = document.getElementById("bar-chart");
  container.prepend(label);
  container.prepend(select);

  return select;
}
