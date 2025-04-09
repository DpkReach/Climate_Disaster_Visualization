const tsvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const svg = d3.select("#bar-race")
  .append("svg")
  .attr("width", 960)
  .attr("height", 600);

const margin = { top: 40, right: 100, bottom: 40, left: 180 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const chartG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const barHeight = 25;
const duration = 1000;

let yearIndex = 0;
let years = [];
let allData = {}; // Format: allData[year][type] = [ [country, total], ... ]
let currentType = "All";

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip-barrace")
  .style("opacity", 0);

// Load data and prepare structure
d3.tsv(tsvUrl).then(rawData => {
  const disasterTypes = Array.from(new Set(rawData.map(d => d["Disaster Type"]).filter(Boolean))).sort();

  // Populate dropdown
  d3.select("#disaster-type")
    .append("option")
    .attr("value", "All")
    .text("All Types");

  disasterTypes.forEach(type => {
    d3.select("#disaster-type")
      .append("option")
      .attr("value", type)
      .text(type);
  });

  // Group data by year and type
  const yearGroups = d3.group(rawData, d => +d.Year);

  years = Array.from(yearGroups.keys()).sort();

  years.forEach(year => {
    const entries = yearGroups.get(year);
    const typeGroups = d3.group(entries, d => d["Disaster Type"]);

    allData[year] = {};

    // Store totals for each type
    typeGroups.forEach((records, type) => {
      allData[year][type] = d3.rollups(
        records,
        v => d3.sum(v, d => +d["Total Events"] || 0),
        d => d.Country
      );
    });

    // Also add "All" group
    allData[year]["All"] = d3.rollups(
      entries,
      v => d3.sum(v, d => +d["Total Events"] || 0),
      d => d.Country
    );
  });

  animate();
});

// Update chart for given year/type
function updateChart(data, year) {
  const topCountries = data
    .filter(d => d[1] > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const x = d3.scaleLinear()
    .domain([0, d3.max(topCountries, d => d[1])])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(topCountries.map(d => d[0]))
    .range([0, topCountries.length * barHeight])
    .padding(0.1);

  chartG.selectAll("*").remove();

  chartG.append("text")
    .attr("class", "year-text")
    .attr("x", width + margin.right)
    .attr("y", height - 100)
    .text(year);

  chartG.selectAll(".bar")
    .data(topCountries, d => d[0])
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => y(d[0]))
    .attr("width", d => x(d[1]))
    .attr("height", y.bandwidth())
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip
        .html(`
          <strong>Country:</strong> ${d[0]}<br>
          <strong>Total Events:</strong> ${d[1]}<br>
          <strong>Year:</strong> ${year}
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

  chartG.selectAll(".label")
    .data(topCountries, d => d[0])
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", -10)
    .attr("y", d => y(d[0]) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d[0]);

  chartG.selectAll(".value-label")
    .data(topCountries, d => d[0])
    .enter()
    .append("text")
    .attr("class", "value-label")
    .attr("x", d => x(d[1]) - 10)
    .attr("y", d => y(d[0]) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text(d => d[1]);
}

// Animate over years
function animate() {
  const interval = d3.interval(() => {
    if (yearIndex >= years.length) {
      interval.stop();
      return;
    }

    const year = years[yearIndex];
    const dataForYear = allData[year];
    const typeKey = currentType === "All" ? "All" : currentType;
    const filteredData = dataForYear[typeKey] || [];

    updateChart(filteredData, year);
    yearIndex++;
  }, duration);
}

// React to dropdown change
d3.select("#disaster-type").on("change", function () {
  currentType = this.value;
  yearIndex = 0;
  animate();
});
