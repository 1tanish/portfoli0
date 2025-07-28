const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
const PORT = 3000;
// const updatesFile = path.join(__dirname, "jsons/updates.json");
const todosFile = path.join(__dirname, "jsons/todo.json");
const statusFile = path.join(__dirname, "jsons/status.json");

app.use(express.json());
app.use(express.static("public"));


// todos section
app.get("/get-todos", (req, res) => {
  if (!fs.existsSync(todosFile)) {
    return res.json([]);
  }
  const data = fs.readFileSync(todosFile, "utf-8");
  res.json(JSON.parse(data));
});


// Updates section
const Update = require("./models/Update.js");
app.get("/get-updates", async (req, res) => {
  try {
    const updates = await Update.find().sort({ date: -1 });
    res.json(updates);
  } catch (err) {
    console.error("Failed to fetch updates:", err);
    res.status(500).send("Failed to fetch updates from MongoDB");
  }
});

app.post("/auth-update", (req, res) => {
  const userpass = req.body.pass;
  if (!userpass) {
    return res.status(400).send("enter password");
  }

  const adminPass = process.env.ADMIN_PASS;
  const secretKey = process.env.JWT_SECRET_KEY;

  if (userpass === adminPass) {
    const token = jwt.sign({ role: "admin" }, secretKey, { expiresIn: "1h" });
    return res.status(200).json({ token });
  } else {
    return res.status(401).send("Wrong password");
  }
});

function verifyToken(req, res, next) {
  const secretKey = process.env.JWT_SECRET_KEY;
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).send("No token provided");

  const token = authHeader.split(" ")[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(403).send("Invalid or expired token");
    req.user = decoded;
    next();
  });
}

// app.post("/submit-update", verifyToken, (req, res) => {
//   const { text } = req.body;
//   if (!text) return res.status(400).send("Missing update text.");

//   const newUpdate = {
//     text,
//     date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
//   };

//   const existingUpdates = fs.existsSync(updatesFile) ? JSON.parse(fs.readFileSync(updatesFile, "utf-8")) : [];
//   existingUpdates.push(newUpdate);

//   fs.writeFileSync(updatesFile, JSON.stringify(existingUpdates, null, 2));

//   res.sendStatus(200);
// });
app.post("/submit-update", verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("Missing update text.");

  const newUpdate = new Update({
    text,
    date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
  });

  await newUpdate.save();
  res.sendStatus(200);
});

////////////Status
const Status = require("./models/Status.js");
app.get("/get-statuses", async (req, res) => {
  try {
    const statuses = await Status.find().sort({ date: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).send("Failed to fetch statuses from MongoDB");
  }
});

app.post("/auth-status", (req, res) => {
  const passInp = req.body.password;
  if (!passInp) {
    return res.status(400).send("Missing password");
  }
  const passAdmin = process.env.ADMIN_PASS;
  const secretKey = process.env.JWT_SECRET_KEY;

  if (passInp === passAdmin) {
    const token = jwt.sign({ role: "admin" }, secretKey, { expiresIn: "1h" });
    return res.status(200).json({ token });
  } else {
    return res.status(401).send("Authenticated failed");
  }
});

// app.post("/submit-status", verifyToken, (req, res) => {
//   const status = req.body.status;

//   if (!status) {
//     return res.status(400).send("Missing status");
//   }

//   const newStatus = {
//     status: status,
//     date: new Date(),
//   };

//   const existingStatuses = fs.existsSync(statusFile) ? JSON.parse(fs.readFileSync(statusFile, "utf-8")) : [];
//   existingStatuses.push(newStatus);

//   fs.writeFileSync(statusFile, JSON.stringify(existingStatuses, null, 2));

//   res.sendStatus(200);
// });

app.post("/submit-status", verifyToken, async (req, res) => {
  const status = req.body.status;
  if (!status) return res.status(400).send("Missing status.");

  const newStatus = new Status({
    status: status,
    date: new Date()
  });

  await newStatus.save();
  console.log("status pushed");
  
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

///////////////////spotify////////////////////////////
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
let accessToken = "";

async function getValidSpotifyResponse(url) {
  if (!accessToken) {
    await refreshSpotifyToken();
  }

  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    await refreshSpotifyToken();

    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return res;
}

async function refreshSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    console.error("❌ Could not refresh token:", data);
    throw new Error("Token refresh failed");
  }

  accessToken = data.access_token;
}

app.get("/my-recently-played", async (req, res) => {
  try {
    const response = await getValidSpotifyResponse("https://api.spotify.com/v1/me/player/recently-played?limit=1");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to get recently played:", err);
    res.status(500).send("Spotify error");
  }
});

app.get("/currently-playing", async (req, res) => {
  try {
    const response = await getValidSpotifyResponse("https://api.spotify.com/v1/me/player/currently-playing");

    if (response.status === 204) {
      return res.json({ playing: false, message: "Nothing is currently playing" });
    }

    const data = await response.json();
    res.json({ playing: true, data });
  } catch (err) {
    console.error("❌ Failed to get currently playing:", err);
    res.status(500).send("Spotify error");
  }
});
