import app from './app';
import 'dotenv/config';
import http from 'http';

const port = process.env.PORT || 3000;

// Vercel serverless handles execution, but for local:
if (process.env.NODE_ENV !== 'production') {
    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
