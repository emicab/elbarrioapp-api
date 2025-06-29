import express from "express";

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;


app.get('/api', (req, res) => {
  res.json({"msg": "Hello worldd"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
