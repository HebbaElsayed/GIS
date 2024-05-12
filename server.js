const NodeGeocoder = require("node-geocoder");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Country = require('./models/locationModels')
const axios = require("axios");
const bodyParser = require('body-parser');
const express = require('express');
let app = express();


const PORT = 3000;

const options = {
  provider: "google",
  apiKey: "AIzaSyAPnmaaaH17KSQ0s9yLxXY_LmqnejBwLEQ",
};
const geocoder = NodeGeocoder(options);

dotenv.config();
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
});

googleMapsClient.geocode(
  { address: "1600 Amphitheatre Parkway, Mountain View, CA" },
  function (err, response) {
    app.get("/ge-coding", (req, res) => {
      if (!err) {
        console.log(response.json.results);
        res.json(response.json.results);
      }
    });
  }
);



app.set("view engine", "ejs");
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/GIS");
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connected successful with database"));

app.get("/", (req, res) => {
  res.render("index", { apiKey: process.env.GOOGLE_MAPS_API_KEY });
});


app.get("/resturants", async (req, res, next) => {
  try {
    const city = "ismailia";
    const category = "resturants";
    const neet_to = "ismailia";
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${neet_to}+${category}+${city}&type=restaurant&key=${apiKey}`
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});
/*
app.get('/near', async(req, res)=>{
    let maxDistance = req.query.maxDistance || 5000000
    let allNearCountries = await Country.find(
        {
            "location": {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [ req.query.long, req.query.lat ]
                    },
                    $maxDistance : maxDistance
                }
            }
        }
    )
    res.send(allNearCountries)
})*/

/*
// Create a geospatial index on the location field
Country.createIndexes({ location: '2dsphere' })
    .then(() => {
        console.log("Geospatial index created successfully");
    })
    .catch((err) => {
        console.error("Error creating geospatial index:", err);
    });*/

app.get('/near', async (req, res) => {
  try {
      // Parse query parameters
      let maxDistance = Number(req.query.maxDistance) || 5000000;
      let longitude = Number(req.query.long);
      let latitude = Number(req.query.lat);

      // Check for missing or invalid input
      if (isNaN(maxDistance) || isNaN(longitude) || isNaN(latitude)) {
          return res.status(400).send('Invalid input. Please provide valid latitude, longitude, and maxDistance.');
      }

      // Find nearby countries
      let allNearCountries = await Country.find({
          "location": {
              $near: {
                  $geometry: {
                      type: "Point",
                      coordinates: [longitude, latitude]
                  },
                  $maxDistance: maxDistance
              }
          }
      });

      // Send response
      res.send(allNearCountries);
  } catch (error) {
      // Handle errors
      console.error("Error fetching nearby countries:", error);
      res.status(500).send("Internal server error");
  }
});

//add country
app.post('/countries', (req, res) => {
  const newCountry = new Country(req.body);

  newCountry.save()
    .then(country => res.json({
        message: "done",
        country
    }))
    .catch(err => res.status(400).json({ error: err.message }));
});


// Read country
app.get('/countries', (req, res) => {
  Country.find()
    .then(countries => res.json(countries))
    .catch(err => res.status(400).json({ error: err.message }));
});

// Update country
app.put('/countries/:id', (req, res) => {
  Country.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then(country => res.json(country))
    .catch(err => res.status(400).json({ error: err.message }));
});

// Delete country
app.delete('/countries/:id', (req, res) => {
  Country.findByIdAndDelete(req.params.id)
    .then(() => res.json({ message: 'Country deleted successfully' }))
    .catch(err => res.status(400).json({ error: err.message }));
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
