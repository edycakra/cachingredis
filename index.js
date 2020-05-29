const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require("axios");
const redis = require("redis");
const client = redis.createClient(6379); //make a new connection to the local instance of redis

client.on("error", (error) => {
  console.log(error);
});

app.get("/recipe/:foodItem", async (req, res) => {
  try {
    const foodItem = req.params.foodItem;

    //checking redis store
    client.get(foodItem, async (err, recipe) => {
      if (recipe) {
        return res.status(200).send({
          error: false,
          message: `Recipe from the cache: ${foodItem}`,
          data: JSON.parse(recipe),
        });
      } else {
        const recipe = await axios.get(
          `http://www.recipepuppy.com/api/?q=${foodItem}`
        );

        //save the record in the cache for subsequent request, expiration in 1440 seconds for example
        client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));

        return res.status(200).send({
          error: false,
          data: recipe.data.results,
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`connected at PORT ${PORT}`);
});
