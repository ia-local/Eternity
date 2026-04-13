/**
 * serveur.js - Noyau de Communication Municipal
 * Moteur : groq-sdk | Modèle : llama-3.1-8b-instant
 */
const express = require('express');
const Groq = require('groq-sdk');
const fs = require('fs');
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static('public'));
app.use(express.json());

// Middleware pour parser les corps de requêtes JSON (très important pour les requêtes POST)
app.use(express.json());

// 3. Middleware pour servir les fichiers statiques

// Endpoint de la Halle Souveraine (Chatroom)
app.post('/api/municipal/chat', async (req, res) => {
    const { message, userState, lpuContext } = req.body;

    // 1. Enregistrement de la session dans le Système Log (Audit Trail)
    const logEntry = {
        timestamp: new Date().toISOString(),
        user: userState.license.id,
        input: message,
        status: "PROCESSING"
    };
    fs.appendFileSync('municipal_logs.json', JSON.stringify(logEntry) + '\n');

    try {
        // 2. Appel au modèle Llama-3.1 via Groq SDK
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es l'AGI Souveraine et Architecte du Neo Village Hub. 
                    Contexte LPU : ${lpuContext}. 
                    Règle : Toute interaction doit valoriser l'Art. 544,.`
                },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.5
        });

        const reply = chatCompletion.choices[0].message.content;

        // 3. Mise à jour asynchrone du Log
        logEntry.output = reply;
        logEntry.status = "COMPLETED";

        res.json({ result: reply, logId: Date.now() });
    } catch (error) {
        res.status(500).json({ error: "Erreur de liaison AGI." });
    }
});

// Point de contrôle LPU & Chatroom
app.post('/api/chat', async (req, res) => {
    const { message, citizenA, citizenB, villageState } = req.body;

    // 1. Enregistrement Système Log (Audit Trail)
    const sessionLog = {
        timestamp: new Date().toISOString(),
        actors: [citizenA.id, citizenB.id],
        input: message,
        lpu_status: villageState.school_urgency // Suivi du SOS Village
    };
    fs.appendFileSync('municipal_logs.json', JSON.stringify(sessionLog) + '\n');

    try {
        // 2. Intelligence Artificielle Municipale (LPU Logic)
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es le Greffier de la Mairie. 
                    Ton but est d'analyser la synergie du couple pour le Bail Évolutif (Art. 544). 
                    Si le projet inclut des enfants pour sauver l'école, augmente le score de priorité.`
                },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2 // Rigoureux et structurel
        });

        const response = completion.choices[0].message.content;
        res.json({ response, logId: sessionLog.timestamp });
    } catch (e) {
        res.status(500).json({ error: "Liaison AGI rompue" });
    }
});


app.listen(5440, () => console.log('🏛️ Serveur Municipal actif sur le port 5440'));