const csvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const margin = { top: 60, right: 100, bottom: 50, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// ✅ USE VALID KEYS THAT EXIST IN YOUR DATASET
const climateKeys = [
  "Temperature",
  "Humidity",
  "CO2 Emissions",
  "Precipitation",
  "Sea Level Rise",
  "Wind Speed"
];

// Add dropdown filters
const container = d3.select("#climate-timeline");
container.insert("select", ":first-child")
  .attr("id", "variable-select")
  .style("margin", "10px")
  .selectAll("option")
  .data(climateKeys)
  .enter()
  .append("option")
  .text(d => d)
  .attr("value", d => d);

container.insert("input", ":first-child")
  .attr("id", "event-threshold")
  .attr("type", "number")
  .attr("placeholder", "Event Threshold")
  .attr("value", 200)
  .style("margin", "10px")
  .style("width", "160px");

const svg = container.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltipClimate = container
  .append("div")
  .attr("class", "tooltipClimate-climate")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(0,0,0,0.85)")
  .style("color", "white")
  .style("padding", "8px 12px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("font-size", "13px");

d3.tsv(csvUrl).then(data => {
  // Clean year and numeric fields
  data.forEach(d => {
    d.Year = +d.Year;
    climateKeys.forEach(key => {
      d[key] = +d[key] || NaN;
    });
    d["Total Events"] = +d["Total Events"] || 0;
  });

  const grouped = d3.rollup(
    data,
    v => {
      const summary = { year: +v[0].Year, events: d3.sum(v, d => d["Total Events"]) };
      climateKeys.forEach(key => {
        summary[key] = d3.mean(v, d => d[key]);
      });
      return summary;
    },
    d => d.Year
  );

  const yearData = Array.from(grouped.values()).sort((a, b) => a.year - b.year);

  const normalizeKey = key => {
    const values = yearData.map(e => e[key]);
    const min = d3.min(values);
    const max = d3.max(values);
    return yearData.map(d => ({
      year: d.year,
      value: (d[key] - min) / (max - min),
      raw: d[key],
      events: d.events
    }));
  };

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]).domain([0, 1]);
  const color = d3.scaleOrdinal().domain(climateKeys).range(d3.schemeSet2);

  const drawChart = (selectedKey, threshold) => {
    svg.selectAll("*").remove();

    const normalized = normalizeKey(selectedKey).filter(d => !isNaN(d.value));
    x.domain(d3.extent(normalized, d => d.year));

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(normalized)
      .attr("fill", "none")
      .attr("stroke", color(selectedKey))
      .attr("stroke-width", 2)
      .attr("d", line);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text("Year");

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text(`Normalized ${selectedKey}`);

    svg.selectAll(".dot")
      .data(normalized.filter(d => d.events >= threshold))
      .enter()
      .append("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.value))
      .attr("r", 5)
      .attr("fill", "red")
      .on("mouseover", (event, d) => {
        tooltipClimate.transition().duration(200).style("opacity", 1);
        tooltipClimate.html(`
          <strong>Year:</strong> ${d.year}<br>
          <strong>Total Events:</strong> ${d.events}<br>
          <strong>${selectedKey}:</strong> ${d.raw?.toFixed(2) || "N/A"}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", () => tooltipClimate.transition().duration(200).style("opacity", 0));
  };

  drawChart(climateKeys[0], 200);

  d3.select("#variable-select").on("change", function () {
    const selected = this.value;
    const threshold = +d3.select("#event-threshold").property("value") || 0;
    drawChart(selected, threshold);
  });

  d3.select("#event-threshold").on("input", function () {
    const selected = d3.select("#variable-select").property("value");
    const threshold = +this.value || 0;
    drawChart(selected, threshold);
  });
});
