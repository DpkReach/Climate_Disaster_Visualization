const tsvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const width = document.getElementById("treemap").clientWidth;
const height = document.getElementById("treemap").clientHeight;

const color = d3.scaleOrdinal(d3.schemeCategory10);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip-treemap")
  .style("opacity", 0);

// Filters
const countryFilter = d3.select("#country-filter");
const yearFilter = d3.select("#year-filter");

let globalData = [];

function updateTreemap(data) {
  const container = d3.select("#treemap");
  container.selectAll(".node").remove();

  const damageByType = d3.rollups(
    data,
    v => d3.sum(v, d => +d["Total Damage (USD, adjusted)"] || 0),
    d => d["Disaster Type"]
  ).map(([type, value]) => ({ name: type || "Unknown", value }));

  const root = d3.hierarchy({ children: damageByType })
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .padding(2)(root);

  const nodes = container.selectAll(".node")
    .data(root.leaves())
    .enter()
    .append("div")
    .attr("class", "node")
    .style("left", d => `${d.x0}px`)
    .style("top", d => `${d.y0}px`)
    .style("width", d => `${d.x1 - d.x0}px`)
    .style("height", d => `${d.y1 - d.y0}px`)
    .style("background-color", d => color(d.data.name))
    .style("opacity", 0)
    .transition().duration(600)
    .style("opacity", 1);

  container.selectAll(".node")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`
        <strong>${d.data.name}</strong><br>
        Total Damage: $${d.data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

  container.selectAll(".node")
    .append("div")
    .text(d => d.data.name)
    .style("font-weight", "bold")
    .style("overflow", "hidden");
}

// Load and initialize
d3.tsv(tsvUrl).then(data => {
  globalData = data;

  const countries = Array.from(new Set(data.map(d => d.Country).filter(Boolean))).sort();
  const years = Array.from(new Set(data.map(d => d.Year).filter(Boolean))).sort();

  countries.forEach(c => {
    countryFilter.append("option").attr("value", c).text(c);
  });

  years.forEach(y => {
    yearFilter.append("option").attr("value", y).text(y);
  });

  applyFilters();
});

// Apply filters on change
function applyFilters() {
  const selectedCountry = countryFilter.property("value");
  const selectedYear = yearFilter.property("value");

  const filtered = globalData.filter(d => {
    return (selectedCountry === "All" || d.Country === selectedCountry) &&
           (selectedYear === "All" || d.Year === selectedYear);
  });

  updateTreemap(filtered);
}

countryFilter.on("change", applyFilters);
yearFilter.on("change", applyFilters);
