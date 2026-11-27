# MYBOARD Studio

Application personnelle pour piloter toutes tes entreprises : tâches, agenda, réseaux sociaux, scripts vidéo, pense-bête, projets, objectifs et finances.

**100 % gratuite** : aucun compte, aucun abonnement, aucun service externe. Tes données restent sur ton appareil.

## Lancer l'application sur l'ordinateur

1. Double-clique sur **`Lancer MYBOARD.bat`**. Une fenêtre noire s'ouvre (laisse-la ouverte) et l'application s'ouvre dans ton navigateur à l'adresse `http://localhost:8642`.
2. **Installe-la** comme une vraie application : dans Chrome ou Edge, clique sur l'icône « Installer » à droite de la barre d'adresse (ou Paramètres → Données & sauvegarde → Installer l'application).
3. Une fois installée, elle a sa propre fenêtre et son icône, et fonctionne **hors ligne**.

> Node.js (gratuit, déjà installé sur ton PC) sert uniquement à faire tourner ce petit serveur local.

## Installer l'application sur le téléphone

L'application est aussi publiée gratuitement en ligne (GitHub Pages). Ouvre son adresse sur ton téléphone, puis :
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».

Chaque appareil garde **ses propres données** : rien n'est envoyé sur internet, la page publiée ne contient que l'application, vide. Pour transférer tes données d'un appareil à l'autre, exporte une sauvegarde sur le premier et restaure-la sur le second.

Sur iPhone, utilise bien l'application installée sur l'écran d'accueil : dans un simple onglet Safari, les données d'un site peu visité peuvent être effacées par le système.

## Sauvegarder tes données (important)

Les données sont stockées dans le navigateur de cet appareil. Pour les protéger :
- **Paramètres → Données & sauvegarde → Exporter une sauvegarde complète** (fichier `.json`, pièces jointes comprises).
- Range ce fichier dans un endroit sûr (Documents, clé USB, disque externe).
- L'application te le rappelle si ta dernière sauvegarde date de plus de 2 semaines.
- **Restaurer…** permet de récupérer une sauvegarde, ou de transférer tes données vers un autre appareil.

## Raccourcis

| Touche | Action |
|---|---|
| `N` | Ajout rapide (tâche, idée, rendez-vous, dépense…) |
| `Ctrl K` ou `/` | Recherche globale |
| `Ctrl Entrée` | Enregistrer la fiche ouverte |
| `Échap` | Fermer |

## Structure des fichiers

```
index.html            page principale
manifest.webmanifest  description de la PWA (nom, icônes)
sw.js                 fonctionnement hors ligne (changer VERSION après une modification)
css/app.css           design
js/core.js            base de données locale, dates, utilitaires
js/model.js           modèle d'entreprise, statuts, calculs (tâches, finances, objectifs)
js/ui.js              navigation, composants, recherche, ajout rapide
js/editor.js          fiches d'édition de tous les éléments
js/views/*.js         une page par fichier
serveur.js            mini-serveur local
```
