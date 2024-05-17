const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

const PORT = 80;
const HOST = "107.23.42.198";

app.use((req, res, next) => {
  const paramsToUpperCase = ["street", "county", "district", "locality"];
  paramsToUpperCase.forEach((key) => {
    if (req.query[key]) {
      req.query[key] = req.query[key].toUpperCase();
    }
  });
  next();
});

app.get("/api/properties", async (req, res) => {
  const {
    newBuild,
    minTransactionDate,
    maxTransactionDate,
    min_price,
    max_price,
    typeLabel,
    estateTypeLabel,
    transactionCategory,
    county,
    district,
    locality,
    postcode,
    street,
    town,
    propertyType,
  } = req.query;

  const baseUrl =
    "https://landregistry.data.gov.uk/data/ppi/transaction-record.json?";
  let queryParams = [];

  const addParam = (key, value) => {
    if (value) {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  };

  addParam("newBuild", newBuild);
  addParam("earliestDate", minTransactionDate);
  addParam("latestDate: ", maxTransactionDate);
  addParam("min-pricePaid", min_price);
  addParam("max-pricePaid", max_price);
  addParam("estateType.prefLabel", estateTypeLabel);
  addParam("transactionCategory.prefLabel", transactionCategory);
  addParam("propertyAddress.county", county);
  addParam("propertyAddress.district", district);
  addParam("propertyAddress.locality", locality);
  addParam("propertyAddress.postcode", postcode);
  addParam("propertyAddress.street", street);
  addParam("propertyAddress.town", town);
  addParam("propertyType.prefLabel", propertyType);

  const queryString = queryParams.join("&");
  const finalUrl = `${baseUrl}${queryString}`;

  try {
    const response = await axios.get(finalUrl);
    res.status(200).json(response.data.result.items);
  } catch (error) {
    console.error("Error fetching data from Land Registry:", error);
    res.status(error.response ? error.response.status : 500).json({
      message: "Failed to fetch data",
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

app.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
