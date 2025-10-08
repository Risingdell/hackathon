const express = require('express');
const cors = require('cors');
const sqlRoutes = require('./routes/sqlRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sql', sqlRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
