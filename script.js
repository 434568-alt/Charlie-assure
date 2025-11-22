// ... (Toute la logique du script.js reste la même) ...


    // Écouteurs d'événements pour déclencher le recalcul
    currentDateInput.addEventListener('change', renderRiEntries); // L'événement change déclenche le render et donc le calcul

    // --- Initialisation ---
    // Ajoute le premier RI par défaut (si la liste est vide)
    if (riEntries.length === 0) {
        // Ajout de 6 relevés par défaut au chargement pour faciliter la saisie rapide.
        for (let i = 0; i < 6; i++) {
            riEntries.push({
                startDate: '',
                endDate: '',
                echeanceDate: '',
                bonusEcheance: 1.00,
                sinistres: {
                    matResp: 0,
                    matNonResp: 0,
                    brisGlace: 0,
                    corporels: 0,
                    vol: 0
                }
            });
        }
    }
    renderRiEntries();
});
