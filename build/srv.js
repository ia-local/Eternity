// server.js - Serveur Express avec gestion statique et API d'enregistrement

// 1. Importations nécessaires
const express = require('express');
const path = require('path');
const fs = require('fs'); // Module natif de Node.js pour l'interaction avec le système de fichiers

// 2. Initialisation et configuration
const app = express();
const PORT = 5440;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_PATH = path.join(__dirname, 'database.json'); // Chemin vers le fichier de stockage

// Middleware pour parser les corps de requêtes JSON (très important pour les requêtes POST)
app.use(express.json());

// 3. Middleware pour servir les fichiers statiques
app.use(express.static(PUBLIC_DIR, { index: false }));

// 4. Route POST d'enregistrement des contrats
app.post('/enregistrer-contrat', (req, res) => {
    const nouveauContrat = req.body;

    // A. Validation des données côté serveur (Sécurité et Rigour)
    if (!nouveauContrat || !nouveauContrat.preteur_nom || !nouveauContrat.emprunteur_nom || !nouveauContrat.bien_adresse) {
        return res.status(400).json({ message: "Données de contrat incomplètes. Nom du prêteur, de l'emprunteur et adresse du bien sont requis." });
    }

    // B. Création d'un identifiant unique (UUID simple basé sur le temps)
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const contratAvecID = {
        id: id,
        date_enregistrement: new Date().toISOString(),
        ...nouveauContrat
    };

    // C. Lecture du fichier existant
    let contrats = [];
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            contrats = JSON.parse(data);
            if (!Array.isArray(contrats)) {
                console.warn("Le fichier database.json n'est pas un tableau. Réinitialisation.");
                contrats = [];
            }
        }
    } catch (error) {
        console.error("Erreur de lecture ou de parsing de database.json:", error);
        // En cas d'erreur de lecture, on part d'un tableau vide pour ne pas bloquer
        contrats = []; 
    }

    // D. Ajout du nouveau contrat
    contrats.push(contratAvecID);

    // E. Écriture dans le fichier (synchrone pour l'agilité, préférable pour une petite DB)
    try {
        // Utilisation de JSON.stringify avec une indentation pour la lisibilité
        fs.writeFileSync(DB_PATH, JSON.stringify(contrats, null, 2), 'utf8');
        console.log(`[DB] Nouveau contrat enregistré avec l'ID: ${id}`);
        
        // F. Réponse de succès
        res.status(201).json({ 
            message: "Contrat enregistré avec succès.", 
            id: id,
            path: DB_PATH 
        });
    } catch (error) {
        console.error("Erreur d'écriture dans database.json:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'enregistrement des données." });
    }
});

// 5. Route spécifique pour la racine (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
        if (err) {
            console.error('Erreur lors de l\'envoi de index.html:', err);
            res.status(404).send('Fichier index.html introuvable dans le répertoire public/.');
        }
    });
});

// 6. Route 404 de secours (Middleware catch-all)
app.use((req, res) => {
    res.status(404).send("Désolé, la ressource demandée n'a pas été trouvée.");
});

// 7. Démarrage du serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur Express démarré avec succès.`);
    console.log(`🌐 Accès au générateur : http://localhost:${PORT}`);
    console.log(`💾 Les contrats seront stockés dans : ${DB_PATH}`);
});