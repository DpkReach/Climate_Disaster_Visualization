const tsvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

const svg = d3.select("#severity-bar-chart")
  .append("svg")
  .attr("width", 960)
  .attr("height", 500);

const margin = { top: 50, right: 80, bottom: 60, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip-bar-grouped")
  .style("opacity", 0);

const typeDropdown = d3.select("#severity-bar-type");

d3.tsv(tsvUrl).then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d["Total Events"] = +d["Total Events"] || 0;
    d["Total Deaths"] = +d["Total Deaths"] || 0;
  });

  const types = Array.from(new Set(data.map(d => d["Disaster Type"]).filter(Boolean))).sort();
  types.forEach(type => {
    typeDropdown.append("option").attr("value", type).text(type);
  });

  drawChart("All");

  typeDropdown.on("change", function () {
    drawChart(this.value);
  });

  function drawChart(selectedType) {
    chart.selectAll("*").remove();

    const filtered = data.filter(d =>
      selectedType === "All" || d["Disaster Type"] === selectedType
    );

    const grouped = d3.rollups(filtered, v => ({
      events: d3.sum(v, d => d["Total Events"]),
      deaths: d3.sum(v, d => d["Total Deaths"])
    }), d => d.Year).map(([year, values]) => ({
      year,
      ...values
    })).sort((a, b) => a.year - b.year);

    const x = d3.scaleBand()
      .domain(grouped.map(d => d.year))
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(["Events", "Deaths"])
      .range([0, x.bandwidth()])
      .padding(0.05);

    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(grouped, d => d.deaths)]).nice()
      .range([height, 0]);

    const yRight = d3.scaleLinear()
      .domain([0, d3.max(grouped, d => d.events)]).nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(["Events", "Deaths"])
      .range(["#4682b4", "#d9534f"]);

    // X Axis
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Y Axis Left: Deaths
    chart.append("g")
      .call(d3.axisLeft(yLeft))
      .append("text")
      .attr("x", -50)
      .attr("y", -10)
      .attr("fill", "#d9534f")
      .text("Total Deaths");

    // Y Axis Right: Events
    chart.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight))
      .append("text")
      .attr("x", 40)
      .attr("y", -10)
      .attr("fill", "#4682b4")
      .text("Total Events");

    // Draw grouped bars
    const yearGroups = chart.selectAll(".year-group")
      .data(grouped)
      .enter()
      .append("g")
      .attr("class", "year-group")
      .attr("transform", d => `translate(${x(d.year)},0)`);

    yearGroups.append("rect")
      .attr("x", x1("Deaths"))
      .attr("y", d => yLeft(d.deaths))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - yLeft(d.deaths))
      .attr("fill", "#d9534f")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Deaths:</strong> ${d.deaths.toLocaleString()}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

    yearGroups.append("rect")
      .attr("x", x1("Events"))
      .attr("y", d => yRight(d.events))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - yRight(d.events))
      .attr("fill", "#4682b4")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Events:</strong> ${d.events.toLocaleString()}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

    // Legend
    const legend = chart.append("g").attr("transform", `translate(${width - 120}, 0)`);
    ["Events", "Deaths"].forEach((label, i) => {
      const g = legend.append("g").attr("transform", `translate(0,${i * 20})`);
      g.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(label));
      g.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(label)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  }
});
