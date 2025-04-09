const csvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const charts = [
  { id: "chart1", x: "CO2 Emissions", y: "Temperature" },
  { id: "chart2", x: "Sea Level Rise", y: "Wind Speed" },
  { id: "chart3", x: "Precipitation", y: "Humidity" },
  { id: "chart4", x: "Temperature", y: "Precipitation" }
];

const width = 500;
const height = 400;
const margin = { top: 40, right: 20, bottom: 50, left: 60 };

// Tooltip for scatter points
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip-scatter")
  .style("opacity", 0);

// Reuse the dropdown already in HTML
const typeFilter = d3.select("#type-dropdown");

function drawCharts(data, selectedType) {
  charts.forEach(({ id, x: xKey, y: yKey }) => {
    // Remove any existing chart
    d3.select(`#${id}`).select("svg")?.remove();

    // Filter and clean data
    const filteredData = data.filter(d =>
      isFinite(+d[xKey]) &&
      isFinite(+d[yKey]) &&
      (selectedType === "All Types" || d["Disaster Type"] === selectedType)
    );

    const x = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => +d[xKey])).nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => +d[yKey])).nice()
      .range([height - margin.bottom, margin.top]);

    const svg = d3.select(`#${id}`).append("svg")
      .attr("width", width)
      .attr("height", height);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text(xKey);

    // Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .append("text")
      .attr("x", -margin.left + 5)
      .attr("y", margin.top - 10)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .text(yKey);

    // Draw circles
    svg.selectAll("circle")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("cx", d => x(+d[xKey]))
      .attr("cy", d => y(+d[yKey]))
      .attr("r", 4)
      .attr("fill", "#4682b4")
      .attr("opacity", 0.75)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <strong>Year:</strong> ${d.Year}<br>
          <strong>${xKey}:</strong> ${d[xKey]}<br>
          <strong>${yKey}:</strong> ${d[yKey]}<br>
          <strong>Disaster Type:</strong> ${d["Disaster Type"] || "N/A"}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
  });
}

// Load and prepare data
d3.tsv(csvUrl).then(data => {
  // Populate dropdown with unique disaster types
  const disasterTypes = Array.from(new Set(data.map(d => d["Disaster Type"]).filter(Boolean)));
  typeFilter.append("option").attr("value", "All Types").text("All Types");
  disasterTypes.forEach(type => {
    typeFilter.append("option").attr("value", type).text(type);
  });

  // Initial chart
  drawCharts(data, "All Types");

  // Event listener for dropdown change
  typeFilter.on("change", function () {
    const selectedType = this.value;
    drawCharts(data, selectedType);
  });
});
