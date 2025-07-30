require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', userRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`User Service running at http://localhost:${PORT}`);
});
