console.log("✅ sharedData.js loaded!");

let cachedData = null;

const csvUrl = "https://gist.githubusercontent.com/revanth122/5bb10be6a6860d69857887789d3f8d02/raw/8a1382b383588253eb3160fcffec078f77531c7c/merged.csv";

export async function loadClimateData() {
  if (cachedData) return Promise.resolve(cachedData);

  return d3.tsv(csvUrl).then(data => {
    cachedData = data;
    console.log("✅ Climate Data Loaded:", data.slice(0, 5));
    return data;
  });
}
