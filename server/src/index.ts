import express from 'express';
import cors from 'cors';

import groupRoutes from './routes/Groups';
import athleteRoutes from './routes/Athlete';
import trainingRoutes from './routes/Trainings';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/groups', groupRoutes);
app.use('/athletes', athleteRoutes);
app.use('/trainings', trainingRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});