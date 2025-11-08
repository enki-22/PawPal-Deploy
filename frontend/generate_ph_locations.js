const phLocations = require('ph-locations');
const fs = require('fs');

const provinces = phLocations.provinces;
const cities = phLocations.cities;

const result = {};
provinces.forEach(province => {
  result[province] = cities[province] || [];
});

fs.writeFileSync('./src/data/ph_locations.json', JSON.stringify(result, null, 2));
console.log('ph_locations.json generated successfully!');