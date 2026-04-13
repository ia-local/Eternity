// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // Spécifie la version du compilateur Solidity

/**
 * @title PacteProprietePartagee
 * @dev Ce contrat intelligent permet d'enregistrer des biens immobiliers
 * mis à disposition dans le cadre d'un pacte de propriété partagée (commodat).
 * Il assure une traçabilité immuable des engagements sur la blockchain.
 */
contract PacteProprietePartagee {

    // =========================================================================
    // Événements (Events)
    // Les événements sont utilisés pour enregistrer des actions sur la blockchain
    // de manière économique, facilement interrogeable par des applications externes.
    // =========================================================================
    event BienEnregistre(
        uint256 indexed idContrat,      // ID unique du contrat pour faciliter la recherche
        address indexed proprietaire,   // Adresse blockchain du propriétaire
        string adresseBien,             // Adresse physique du bien
        uint256 dateEnregistrement      // Timestamp de l'enregistrement
    );

    event OccupantDesigne(
        uint256 indexed idContrat,      // ID du contrat concerné
        address indexed ancienOccupant, // Adresse de l'ancien occupant (0x0 si premier)
        address indexed nouvelOccupant, // Adresse blockchain du nouvel occupant
        uint256 dateDesignation         // Timestamp de la désignation
    );

    // =========================================================================
    // Structures de Données (Structs)
    // Les structs permettent de regrouper plusieurs variables en un seul type.
    // =========================================================================

    /**
     * @dev Représente un bien immobilier engagé dans le pacte.
     */
    struct BienImmobilier {
        address proprietaire;           // Adresse blockchain du propriétaire du bien
        string adressePhysique;         // Adresse postale complète du bien
        string detailsBien;             // Description additionnelle du bien (e.g., "Maison 3 pièces")
        uint256 dateEngagement;         // Timestamp de l'engagement du bien
        address occupantActuel;         // Adresse blockchain de l'occupant actuel (0x0 si vacant)
        uint256 dateOccupationDebut;    // Timestamp du début de l'occupation actuelle
        bool estActif;                  // Indique si le bien est toujours actif dans le pacte
    }

    // =========================================================================
    // Variables d'État (State Variables)
    // Ces variables sont stockées de manière permanente sur la blockchain.
    // =========================================================================

    // Mappage pour stocker les biens par un ID unique (uint256)
    mapping(uint256 => BienImmobilier) public biens;

    // Compteur pour générer des IDs de contrat uniques
    uint256 public nextContratId;

    // L'adresse du déployeur du contrat, qui aura des droits d'administration.
    address public admin;

    // =========================================================================
    // Constructeur (Constructor)
    // Exécuté une seule fois lors du déploiement du contrat.
    // =========================================================================
    constructor() {
        admin = msg.sender; // Le déployeur du contrat est l'administrateur
        nextContratId = 1;  // L'ID du premier contrat sera 1
    }

    // =========================================================================
    // Modificateurs (Modifiers)
    // Les modificateurs permettent d'ajouter des conditions avant l'exécution
    // d'une fonction, pour la sécurité et la réutilisabilité du code.
    // =========================================================================

    /**
     * @dev Restreint l'accès à une fonction à l'administrateur du contrat uniquement.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Seul l'administrateur peut appeler cette fonction.");
        _; // Le '_' indique où le code de la fonction s'insère
    }

    /**
     * @dev Restreint l'accès à une fonction au propriétaire d'un bien donné.
     * @param _idContrat L'ID du contrat du bien concerné.
     */
    modifier onlyProprietaire(uint256 _idContrat) {
        require(biens[_idContrat].proprietaire == msg.sender, "Seul le proprietaire du bien peut appeler cette fonction.");
        _;
    }

    /**
     * @dev Vérifie qu'un bien existe et est actif.
     * @param _idContrat L'ID du contrat du bien.
     */
    modifier bienActif(uint256 _idContrat) {
        require(biens[_idContrat].proprietaire != address(0), "Ce contrat n'existe pas ou l'ID est invalide.");
        require(biens[_idContrat].estActif, "Ce bien n'est plus actif dans le pacte.");
        _;
    }

    // =========================================================================
    // Fonctions (Functions)
    // C'est la logique exécutable du contrat.
    // =========================================================================

    /**
     * @dev Enregistre un nouveau bien immobilier dans le pacte.
     * Accessible par n'importe qui (pour permettre aux propriétaires de s'engager).
     * @param _adressePhysique L'adresse postale complète du bien.
     * @param _detailsBien Une description additionnelle du bien.
     * @return L'ID unique du contrat nouvellement créé.
     */
    function enregistrerBien(
        string calldata _adressePhysique,
        string calldata _detailsBien
    ) public returns (uint256) {
        // Le `calldata` est utilisé pour les arguments de fonction externes qui ne modifient pas l'état
        require(bytes(_adressePhysique).length > 0, "L'adresse physique ne peut pas etre vide.");

        uint256 currentId = nextContratId;

        biens[currentId] = BienImmobilier({
            proprietaire: msg.sender,         // L'adresse qui appelle la fonction devient le propriétaire
            adressePhysique: _adressePhysique,
            detailsBien: _detailsBien,
            dateEngagement: block.timestamp,  // Timestamp du bloc actuel
            occupantActuel: address(0),       // Initialement, aucun occupant
            dateOccupationDebut: 0,           // Pas de date de début d'occupation
            estActif: true
        });

        nextContratId++; // Incrémente le compteur pour le prochain ID

        // Émet l'événement pour notifier l'enregistrement du bien
        emit BienEnregistre(currentId, msg.sender, _adressePhysique, block.timestamp);

        return currentId;
    }

    /**
     * @dev Désigne un occupant pour un bien immobilier existant.
     * Accessible uniquement par le propriétaire du bien.
     * @param _idContrat L'ID du contrat du bien concerné.
     * @param _nouvelOccupant L'adresse blockchain du nouvel occupant.
     */
    function designerOccupant(
        uint256 _idContrat,
        address _nouvelOccupant
    ) public onlyProprietaire(_idContrat) bienActif(_idContrat) {
        require(_nouvelOccupant != address(0), "L'adresse de l'occupant ne peut pas etre nulle.");
        require(biens[_idContrat].occupantActuel != _nouvelOccupant, "Cet occupant est deja designe pour ce bien.");

        address ancienOccupant = biens[_idContrat].occupantActuel;

        biens[_idContrat].occupantActuel = _nouvelOccupant;
        biens[_idContrat].dateOccupationDebut = block.timestamp;

        // Émet l'événement pour notifier la désignation de l'occupant
        emit OccupantDesignes(
            _idContrat,
            ancienOccupant,
            _nouvelOccupant,
            block.timestamp
        );
    }

    /**
     * @dev Retire un occupant d'un bien (le rend vacant).
     * Accessible uniquement par le propriétaire du bien.
     * @param _idContrat L'ID du contrat du bien concerné.
     */
    function retirerOccupant(
        uint256 _idContrat
    ) public onlyProprietaire(_idContrat) bienActif(_idContrat) {
        require(biens[_idContrat].occupantActuel != address(0), "Ce bien n'a pas d'occupant a retirer.");

        address ancienOccupant = biens[_idContrat].occupantActuel;

        biens[_idContrat].occupantActuel = address(0); // Remet l'occupant à zéro
        biens[_idContrat].dateOccupationDebut = 0;     // Réinitialise la date de début

        emit OccupantDesignes(
            _idContrat,
            ancienOccupant,
            address(0), // Nouvel occupant est 0x0 (vacant)
            block.timestamp
        );
    }

    /**
     * @dev Retire un bien du pacte (ex: vente, changement de destination).
     * Accessible uniquement par le propriétaire du bien.
     * Note : Le bien reste dans le stockage pour l'historique, mais est marqué inactif.
     * @param _idContrat L'ID du contrat du bien à retirer.
     */
    function retirerBienDuPacte(
        uint256 _idContrat
    ) public onlyProprietaire(_idContrat) bienActif(_idContrat) {
        biens[_idContrat].estActif = false;
        biens[_idContrat].occupantActuel = address(0); // Assure qu'il n'y a plus d'occupant
        biens[_idContrat].dateOccupationDebut = 0;
        // Optionnel : Émettre un événement BienRetire
    }

    // =========================================================================
    // Fonctions de Lecture (View Functions)
    // Ces fonctions ne modifient pas l'état de la blockchain et sont gratuites à appeler.
    // =========================================================================

    /**
     * @dev Permet de récupérer les informations d'un bien par son ID.
     * @param _idContrat L'ID du contrat du bien.
     * @return Toutes les informations structurées du BienImmobilier.
     */
    function getBien(uint256 _idContrat) public view returns (
        address proprietaire,
        string memory adressePhysique,
        string memory detailsBien,
        uint256 dateEngagement,
        address occupantActuel,
        uint256 dateOccupationDebut,
        bool estActif
    ) {
        BienImmobilier storage bien = biens[_idContrat]; // Utilise storage pour économiser du gaz si pas de copie
        require(bien.proprietaire != address(0), "Contrat non trouve.");

        return (
            bien.proprietaire,
            bien.adressePhysique,
            bien.detailsBien,
            bien.dateEngagement,
            bien.occupantActuel,
            bien.dateOccupationDebut,
            bien.estActif
        );
    }

    /**
     * @dev Retourne le prochain ID de contrat disponible.
     */
    function getNextContratId() public view returns (uint256) {
        return nextContratId;
    }

    /**
     * @dev Permet de vérifier si une adresse est l'administrateur.
     */
    function isAdmin(address _addr) public view returns (bool) {
        return _addr == admin;
    }
}