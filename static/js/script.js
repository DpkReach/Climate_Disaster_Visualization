const csvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

d3.tsv(csvUrl).then(data => {
  const cleanData = data.filter(d =>
    d.Year && !isNaN(+d.Year) &&
    d["Total Events"] && !isNaN(+d["Total Events"]) &&
    d["CO2 Emissions"] && !isNaN(+d["CO2 Emissions"])
  );

  const yearlyData = Array.from(
    d3.rollup(
      cleanData,
      v => ({
        events: d3.sum(v, d => +d["Total Events"]),
        co2: d3.mean(v, d => +d["CO2 Emissions"])
      }),
      d => +d.Year
    ),
    ([year, values]) => ({ year, events: values.events, co2: values.co2 })
  ).sort((a, b) => a.year - b.year);

  const margin = { top: 60, right: 60, bottom: 40, left: 60 };
  const width = 960 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(yearlyData, d => d.year))
    .range([0, width]);

  const yEvents = d3.scaleLinear()
    .domain([0, d3.max(yearlyData, d => d.events)]).nice()
    .range([height, 0]);

  const yCO2 = d3.scaleLinear()
    .domain([0, d3.max(yearlyData, d => d.co2)]).nice()
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(yEvents));

  svg.append("g")
    .attr("transform", `translate(${width},0)`)
    .call(d3.axisRight(yCO2));

  const lineEvents = d3.line()
    .x(d => x(d.year))
    .y(d => yEvents(d.events))
    .curve(d3.curveMonotoneX);

  const lineCO2 = d3.line()
    .x(d => x(d.year))
    .y(d => yCO2(d.co2))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(yearlyData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", lineEvents);

  svg.append("path")
    .datum(yearlyData)
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-width", 2)
    .attr("d", lineCO2);

  // Legend
  const legend = svg.append("g")
    .attr("transform", "translate(0,-30)");

  legend.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", "steelblue");
  legend.append("text")
    .attr("x", 20).attr("y", 10).text("Total Events").attr("alignment-baseline", "middle");

  legend.append("rect")
    .attr("x", 130).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", "tomato");
  legend.append("text")
    .attr("x", 150).attr("y", 10).text("CO₂ Emissions").attr("alignment-baseline", "middle");

  // Tooltip
  const focus = svg.append("g").style("display", "none");

  focus.append("circle").attr("r", 5).attr("fill", "steelblue").attr("id", "circle-events");
  focus.append("circle").attr("r", 5).attr("fill", "tomato").attr("id", "circle-co2");

  const tooltipBox = d3.select("#line-chart")
    .append("div")
    .attr("class", "tooltip-line")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("padding", "6px 12px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "0.9em");

  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", () => {
      focus.style("display", null);
      tooltipBox.style("opacity", 1);
    })
    .on("mouseout", () => {
      focus.style("display", "none");
      tooltipBox.style("opacity", 0);
    })
    .on("mousemove", function (event) {
      const bisect = d3.bisector(d => d.year).left;
      const x0 = x.invert(d3.pointer(event, this)[0]);
      const i = bisect(yearlyData, x0, 1);

      const d0 = yearlyData[i - 1];
      const d1 = yearlyData[i];
      if (!d0 || !d1) return;

      const d = x0 - d0.year > d1.year - x0 ? d1 : d0;

      focus.select("#circle-events").attr("cx", x(d.year)).attr("cy", yEvents(d.events));
      focus.select("#circle-co2").attr("cx", x(d.year)).attr("cy", yCO2(d.co2));

      tooltipBox
        .html(`
          <strong>Year:</strong> ${d.year}<br/>
          <strong>Total Events:</strong> ${Math.round(d.events)}<br/>
          <strong>CO₂ Emissions:</strong> ${d.co2.toFixed(2)}
        `)
        .style("left", `${d3.pointer(event, this)[0] + 80}px`)
        .style("top", `${d3.pointer(event, this)[1] + 40}px`);
    });

}).catch(error => {
  console.error("❌ Error loading or processing data:", error);
});
