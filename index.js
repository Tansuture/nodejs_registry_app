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

const PORT = 3002;

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
    transactionDate,
    min_price,
    max_price,
    estateType,
    transactionCategory,
    county,
    district,
    locality,
    postcode,
    street,
    propertyType,
  } = req.query;

  const baseUrl = "https://landregistry.data.gov.uk/landregistry/query";
  let query = `
    PREFIX ppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    SELECT ?postcode ?amount ?date ?status
    WHERE {
      ?transx a ppi:TransactionRecord .
      ?transx ppi:pricePaid ?amount .
      ?transx ppi:transactionDate ?date .
      ?transx ppi:propertyAddress ?addr .
      ?transx ppi:recordStatus ?status .
      ?addr lrcommon:postcode ?postcode .
  `;

  if (newBuild) query += `?transx ppi:newBuild "${newBuild}" . `;
  if (transactionDate)
    query += `?transx ppi:transactionDate "${transactionDate}" . `;
  if (min_price)
    query += `?transx ppi:pricePaid ?amount . FILTER(?amount >= ${min_price}) `;
  if (max_price)
    query += `?transx ppi:pricePaid ?amount . FILTER(?amount <= ${max_price}) `;
  if (estateType)
    query += `?transx ppi:estateType.prefLabel "${estateType}" . `;
  if (transactionCategory)
    query += `?transx ppi:transactionCategory.prefLabel "${transactionCategory}" . `;
  if (county) query += `?addr lrcommon:county "${county}" . `;
  if (district) query += `?addr lrcommon:district "${district}" . `;
  if (locality) query += `?addr lrcommon:locality "${locality}" . `;
  if (postcode) query += `?addr lrcommon:postcode "${postcode}" . `;
  if (street) query += `?addr lrcommon:street "${street}" . `;
  if (propertyType) {
    if (typeof propertyType === "string") {
      query += `?transx ppi:propertyType.prefLabel "${propertyType}" . `;
    } else {
      propertyType.forEach((type) => {
        query += `?transx ppi:propertyType.prefLabel "${type}" . `;
      });
    }
  }

  query += `} LIMIT 100`;
  console.log(query);

  const params = {
    query: query,
    output: "json",
  };

  try {
    const response = await axios.get(baseUrl, { params });
    res.status(200).json(response.data.results.bindings);
  } catch (error) {
    console.error("Error fetching data from Land Registry:", error);
    res.status(error.response ? error.response.status : 500).json({
      message: "Failed to fetch data",
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
