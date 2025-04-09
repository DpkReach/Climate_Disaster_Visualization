
console.log("Starting data load...");

console.log("✅ main.js is running");
d3.csv("static/DV_ClimateChange.csv", d => ({
  ...d,
  Year: +d.Year,
  Temperature: +d.Temperature,
  Humidity: +d.Humidity,
  "Total Events": +d["Total Events"],
  "Total Deaths": +d["Total Deaths"],
  "Total Affected": +d["Total Affected"],
  "Total Damage (USD, adjusted)": +d["Total Damage (USD, adjusted)"],
  "CO2 Emissions": +d["CO2 Emissions"]
})).then(data => {
  console.log("CSV data loaded:", data); // ✅ This will now work

  // Save globally
  window.globalData = data;

  // Show default viz
  showViz('viz1');
});


// 1. Line Chart - Disasters Over Years
function drawDisastersOverYears(data) {

  console.log("Drawing viz1 with data:", data);
  const svg = d3.select("#viz1 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const yearly = d3.rollup(data, v => d3.sum(v, d => d["Total Events"]), d => d.Year);
  const years = Array.from(yearly.keys()).sort((a, b) => a - b);
  const values = years.map(y => ({ year: y, events: yearly.get(y) }));

  const x = d3.scaleLinear().domain(d3.extent(years)).range([50, width - 20]);
  const y = d3.scaleLinear().domain([0, d3.max(values, d => d.events)]).nice().range([height - 30, 20]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.events));

  svg.append("g")
    .attr("transform", `translate(0,${height - 30})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(50,0)`)
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(values)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5)
    .attr("d", line);
}

// 2. Bar Chart - Top 10 Countries by Total Deaths
function drawTopDeathsByCountry(data) {
  const svg = d3.select("#viz2 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const grouped = d3.rollup(data, v => d3.sum(v, d => d["Total Deaths"]), d => d.Country);
  const top = Array.from(grouped.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 10);

  const x = d3.scaleBand()
    .domain(top.map(d => d[0]))
    .range([50, width - 20])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(top, d => d[1])])
    .nice()
    .range([height - 30, 20]);

  svg.append("g")
    .attr("transform", `translate(0,${height - 30})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(50,0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(top)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))  // x-axis position
    .attr("y", d => y(d[1]))  // y-axis position
    .attr("width", x.bandwidth())  // width of the bar
    .attr("height", d => height - 30 - y(d[1]))  // height of the bar
    .attr("fill", "tomato");
}

// 3. Bar Chart - Events by Disaster Type
function drawEventsByType(data) {
  const svg = d3.select("#viz3 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const grouped = d3.rollup(data, v => d3.sum(v, d => d["Total Events"]), d => d["Disaster Type"]);
  const types = Array.from(grouped.keys());
  const values = types.map(t => ({ type: t, events: grouped.get(t) }));

  const x = d3.scaleBand().domain(types).range([50, width - 20]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(values, d => d.events)]).nice().range([height - 30, 20]);

  svg.append("g")
    .attr("transform", `translate(0,${height - 30})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(50,0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(values)
    .enter()
    .append("rect")
    .attr("x", d => x(d.type))  // x-axis position
    .attr("y", d => y(d.events))  // y-axis position
    .attr("width", x.bandwidth())  // width of the bar
    .attr("height", d => height - 30 - y(d.events))  // height of the bar
    .attr("fill", "tomato");
}

// 4. Pie Chart - Disaster Groups
function drawDisasterGroups(data) {
  const svg = d3.select("#viz4 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const radius = Math.min(width, height) / 2 - 20;

  const groupCounts = d3.rollup(data, v => d3.sum(v, d => d["Total Events"]), d => d["Disaster Group"]);
  const color = d3.scaleOrdinal(d3.schemeSet2);

  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  g.selectAll("path")
    .data(pie(groupCounts.entries()))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .attr("stroke", "#fff");
}

// 5. Heatmap - CO2 Emissions per Year by Country
function drawCO2Heatmap(data) {
  const svg = d3.select("#viz5 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const countries = Array.from(new Set(data.map(d => d.Country))).slice(0, 10); // top 10 only
  const years = Array.from(new Set(data.map(d => d.Year))).sort();

  const filtered = data.filter(d => countries.includes(d.Country));
  const color = d3.scaleSequential().domain(d3.extent(filtered, d => d["CO2 Emissions"])).interpolator(d3.interpolateOranges);

  const x = d3.scaleBand().domain(years).range([60, width - 20]).padding(0.05);
  const y = d3.scaleBand().domain(countries).range([20, height - 30]).padding(0.05);

  svg.append("g").attr("transform", `translate(0,${height - 30})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", `translate(60,0)`).call(d3.axisLeft(y));

  svg.selectAll()
    .data(filtered)
    .enter()
    .append("rect")
    .attr("x", d => x(d.Year))
    .attr("y", d => y(d.Country))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d["CO2 Emissions"]));
}

// 6. Scatter Plot - Temperature vs CO2 Emissions
function drawTemperatureVsCO2(data) {
  const svg = d3.select("#viz6 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const x = d3.scaleLinear().domain(d3.extent(data, d => d["CO2 Emissions"])).nice().range([50, width - 20]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.Temperature)).nice().range([height - 30, 20]);

  svg.append("g").attr("transform", `translate(0,${height - 30})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform", `translate(50,0)`).call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d["CO2 Emissions"]))
    .attr("cy", d => y(d.Temperature))
    .attr("r", 3)
    .attr("fill", "#007acc")
    .attr("opacity", 0.6);
}

// 7. Bubble Chart - Impact of Disasters
function drawBubbleImpact(data) {
  const svg = d3.select("#viz7 svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const x = d3.scaleLinear().domain([0, d3.max(data, d => d["Total Affected"])]).nice().range([50, width - 20]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d["Total Damage (USD, adjusted)"])]).nice().range([height - 30, 20]);

  svg.append("g").attr("transform", `translate(0,${height - 30})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform", `translate(50,0)`).call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d["Total Affected"]))
    .attr("cy", d => y(d["Total Damage (USD, adjusted)"]))
    .attr("r", 5)
    .attr("fill", "orange")
    .attr("opacity", 0.6);
  }


// Function to switch between visualizations


function showViz(vizId) {
  d3.selectAll('.viz').style('display', 'none');
  d3.select(`#${vizId}`).style('display', 'block');
  const data = window.globalData;
  if (!data) {
    console.error("Data not loaded yet!");
    return;
  }

  //const data = window.globalData;
  switch (vizId) {
    case 'viz1': drawDisastersOverYears(data); break;
    case 'viz2': drawTopDeathsByCountry(data); break;
    case 'viz3': drawEventsByType(data); break;
    case 'viz4': drawDisasterGroups(data); break;
    case 'viz5': drawCO2Heatmap(data); break;
    case 'viz6': drawTemperatureVsCO2(data); break;
    case 'viz7': drawBubbleImpact(data); break;
  }
}


