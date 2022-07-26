const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
var getIp = require("ipware")().get_ip;

const app = express();
const port = process.env.PORT || 8080;

//middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mlzp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const productsCollection = client
      .db("fandaCommerce")
      .collection("products");
    const usersCollection = client.db("fandaCommerce").collection("users");
    const ipCollection = client.db("fandaCommerce").collection("ip");

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });

    app.get("/new-arrival", async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.get("/category/:title", async (req, res) => {
      const { title } = req.params;
      const query = { category: { $elemMatch: { $in: [title] } } };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      if (result.role === "admin") {
        res.send(true);
      } else {
        res.send(false);
      }
    });

    app.post("/", async (req, res) => {
      // const ipInfo = getIp(req);
      const ip =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
      if (ip) {
        const findIp = await ipCollection.findOne({ ip });
        if (findIp) {
          return;
        } else {
          const result = await ipCollection.insertOne({ ip });
          res.send(result);
        }
      }
    });

    app.post("/make-order", (req, res) => {
      const order = req.body.order;
    });

    app.post("/login", async (req, res) => {
      const { email } = req.body;
      const findUser = await usersCollection.findOne({ email });
      const token = jwt.sign(email, process.env.ACCESS_SECRET_TOKEN);
      if (findUser) {
        res.send({ token });
      } else {
        const result = await usersCollection.insertOne({ email });
        res.send({ result, token });
      }
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server");
});

app.listen(port, () => {
  console.log(port);
});

// devil.robiul.11
