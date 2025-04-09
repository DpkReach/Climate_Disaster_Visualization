const dataUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";
const worldMapUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const width = 960;
const height = 600;

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoNaturalEarth1()
  .scale(160)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const tooltipMap = d3.select("body").append("div")
  .attr("class", "tooltip-map")
  .style("opacity", 0);

let disasterData, countries;

function updateMap(year, eventType) {
  const filteredData = disasterData.filter(d =>
    (+d.Year === +year || year === "All") &&
    (d["Disaster Type"] === eventType || eventType === "All")
  );

  const deathsByCountry = d3.rollup(
    filteredData,
    v => d3.sum(v, d => +d["Total Deaths"] || 0),
    d => d.Country.trim().toLowerCase()
  );

  const color = d3.scaleSequentialSqrt(d3.interpolateReds)
    .domain([0, d3.max(deathsByCountry.values()) || 1]);

  svg.selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const name = d.properties.name.toLowerCase();
      const deaths = deathsByCountry.get(name);
      return deaths ? color(deaths) : "#ccc";
    })
    .attr("stroke", "#444")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      const name = d.properties.name;
      const deaths = deathsByCountry.get(name.toLowerCase()) || 0;
      tooltipMap.transition().duration(200).style("opacity", 0.9);
      tooltipMap.html(`<strong>${name}</strong><br/>Total Deaths: ${deaths}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltipMap.transition().duration(300).style("opacity", 0);
    });
}

Promise.all([
  d3.json(worldMapUrl),
  d3.tsv(dataUrl)
]).then(([world, data]) => {
  disasterData = data;
  countries = topojson.feature(world, world.objects.countries).features;

  // Extract unique years and types
  const years = Array.from(new Set(data.map(d => +d.Year))).sort((a, b) => a - b);
  const types = Array.from(new Set(data.map(d => d["Disaster Type"]))).sort();

  const yearFilter = d3.select("#yearFilter");
  const eventFilter = d3.select("#eventFilter");

  yearFilter.append("option").text("All").attr("value", "All");
  years.forEach(y => yearFilter.append("option").text(y).attr("value", y));

  eventFilter.append("option").text("All").attr("value", "All");
  types.forEach(t => eventFilter.append("option").text(t).attr("value", t));

  // Initial load
  updateMap("All", "All");

  // Update map on filter change
  yearFilter.on("change", () => updateMap(yearFilter.node().value, eventFilter.node().value));
  eventFilter.on("change", () => updateMap(yearFilter.node().value, eventFilter.node().value));
});
