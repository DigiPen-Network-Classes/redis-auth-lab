"use strict";
const port = 13100;
import dotenv from 'dotenv';
dotenv.config();

import redis from 'redis';
const redisClient = redis.createClient(6379, '127.0.0.1');
await redisClient.connect();

import express from 'express';
const app = express();
app.use(express.json());

function buildResult(userId, score) {
    return {
        userId: userId,
        score: score
    };
}    

app.post('/scoresByUser/:userId', async (req, res) => {
    if (!req.body.score) {
        console.log(`No req.body.score provided`);
        res.sendStatus(400);
        return;
    }
    const key = `scores:${req.params.userId}`;
    try {
        await redisClient.set(key, req.body.score);
    } catch(err) {
        console.log(`failed to set score ${err}`);
        res.sendStatus(500);
        return;
    }
    if (req.body.expire) {
        await redisClient.expire(key, 8);
    }
    const result = buildResult(req.params.userId, req.body.score);
    res.send(result);
});

app.get('/scoresByUser/:userId', async (req, res) => {
    let score = await redisClient.get(`scores:${req.params.userId}`);
    if (score === null) {
        res.sendStatus(404);
        return;
    }
    const result = buildResult(req.params.userId, parseInt(score)); 
    res.send(result);
});

app.listen(port, error => {
    if (error != null) {
        console.log(`Error starting express on port ${port}: ${error}`);
    } else {
        console.log(`Listening on port ${port}`);
    }
});    
