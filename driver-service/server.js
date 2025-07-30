require('dotenv').config();
const express = require('express');
const cors = require('cors');
const driverRoutes = require('./routes/driverRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', driverRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Driver Service running at http://localhost:${PORT}`);
});
