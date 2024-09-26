const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = 3000;

// cors - allow connection from different domains and ports
app.use(cors());

// convert json string to json object (from request)
app.use(express.json({
  verify : (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch(e) {
      res.status(400).end();
      throw Error('invalid JSON');
    }
  }
}));

// express.static make folder static
app.use("/", express.static("public"));

mongoose.connect(process.env.MONGODB);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Database test connected");
});

// scheema
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
});

// model
const Todo = mongoose.model("Todo", todoSchema, "todos");

// Funktio json validointia varten
function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// todos-route
app.get("/todos", async (request, response) => {
  try {
    const todos = await Todo.find({});
    response.json(todos);
  } catch (error) {
    response.status(500).end();
  }
});
app.post("/todos", async (request, response) => {
  const { text } = request.body;
  if (!text) 
    return response.status(400).end();
  const todo = new Todo({
    text: text,
  });
  const savedTodo = await todo.save();
  response.json(savedTodo);
});
app.get("/todos/:id", async (request, response) => {
  if (Object.values(request.params.id).length < 24)
    return response.status(400).end();
  try {
    const todo = await Todo.findById(request.params.id);
    if (todo) response.json(todo);
    else response.status(404).end();
  } catch (error) {
    response.status(404).end();
  }
});
// Put-reitti lisätty, osa 2
app.put("/todos/:id", async (request, response) => {
  if (Object.values(request.params.id).length < 24)
    return response.status(400).end();
  // Haetaan päivityspyynnön runko (request.body), jossa on uusi tehtäväteksti
  const { text } = request.body;

  // Luodaan päivitettävä tehtäväobjekti
  const todo = {
    text: text,
  };

  // Etsitään tehtävä tietokannasta ID:n perusteella ja päivitetään sen tiedot
  const filter = { _id: request.params.id }; // Hae tehtävä ID:llä
  const updatedTodo = await Todo.findOneAndUpdate(filter, todo, {
    new: true, // Palautetaan päivitetty tehtävä
  });

  // Palautetaan päivitetty tehtävä vastauksena
  response.json(updatedTodo);
});
app.delete("/todos/:id", async (request, response) => {
  if (Object.values(request.params.id).length < 24)
    return response.status(400).end();
  try {
    const deletedTodo = await Todo.deleteOne({ _id: request.params.id });
    if (deletedTodo) response.json(deletedTodo);
    else response.status(404).end();
  } catch (error) {
    response.status(404).end();
  }
});

// app listen port 3000
app.listen(port, () => {
  console.log("Example app listening on port 3000");
});
