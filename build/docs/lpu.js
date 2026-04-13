const express = require('express');
const Groq = require('groq-sdk');
const fs = require('fs');
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static('public'));
app.use(express.json());

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

app.listen(3145, () => console.log('🏛️ Hub Municipal Souverain actif sur :3145'));