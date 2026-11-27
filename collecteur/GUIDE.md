# Installer le collecteur MYBOARD (gratuit, environ 15 minutes)

Le collecteur est un petit programme qui tourne **sur ton compte Google**, gratuitement et en permanence. Toutes les heures, il récupère :
- tes **ventes Stripe et PayPal** (montants, frais, remboursements) ;
- tes **statistiques Instagram** et tes **dépenses Publicités Meta** ;
- les **visites de tes tunnels** Systeme.io (grâce au code de suivi).

Il sert aussi à **synchroniser** l'application entre ton ordinateur et ton téléphone (via ton Google Drive).

> 🔒 Tes clés secrètes restent dans ton compte Google, dans les « Propriétés du script ». Ne les colle jamais ailleurs, et ne les envoie à personne.

---

## Étape 1 — Créer le collecteur (5 min)

1. Va sur **https://script.google.com** (avec ton compte Google), puis clique sur **Nouveau projet**.
2. Renomme le projet en haut à gauche : `MYBOARD Collecteur`.
3. Efface le contenu de `Code.gs`, puis colle **tout** le contenu du fichier [`Code.gs`](Code.gs) de ce dossier. Enregistre (💾).
4. En haut, choisis la fonction **`installer`**, puis clique sur **▶ Exécuter**.
5. Google demande des autorisations. Clique sur **Examiner les autorisations**, choisis ton compte, puis **Paramètres avancés → Accéder à MYBOARD Collecteur (non sécurisé)** → **Autoriser**.
   *(Le message « non sécurisé » s'affiche pour tout script personnel non publié : c'est ton propre code, sur ton propre compte.)*
6. En bas, le **journal d'exécution** affiche ta **clé d'application**. Copie-la.

## Étape 2 — Publier le collecteur (2 min)

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Clique sur la roue ⚙ → **Application Web**.
3. Choisis **Exécuter en tant que : Moi** et **Qui a accès : Tout le monde**.
   *(Indispensable pour que tes pages de tunnel puissent envoyer les visites. Les données, elles, ne sont lisibles qu'avec ta clé.)*
4. Clique sur **Déployer**, puis copie l'**URL de l'application Web** (elle se termine par `/exec`).

## Étape 3 — Brancher l'application (1 min)

1. Dans MYBOARD : **Paramètres → Connexions**.
2. Colle l'**URL** et la **clé d'application**, puis clique sur **Connecter**.
3. Sur ton téléphone : dans **Connexions**, clique sur **Copier le lien de connexion**, envoie-le-toi en message privé et ouvre-le sur le téléphone. Tes données arrivent toutes seules.

---

## Étape 4 — Stripe (2 min)

1. Tableau de bord Stripe → **Développeurs → Clés API → Créer une clé restreinte**.
2. Nom : `MYBOARD`. Mets **Lecture** sur **Charges** (paiements) et sur **Balance** (solde, pour les frais). Laisse tout le reste sur « Aucun ».
3. Copie la clé (elle commence par `rk_live_…`).
4. Dans Apps Script : **⚙ Paramètres du projet → Propriétés du script → Ajouter une propriété** :
   - Propriété : `STRIPE_NOMDUBUSINESS` (par exemple `STRIPE_LUMIERE`)
   - Valeur : la clé copiée

*Plusieurs comptes Stripe ? Ajoute une propriété par compte (`STRIPE_LUMIERE`, `STRIPE_SAVEURS`…).*

## Étape 5 — PayPal (4 min)

1. Va sur **https://developer.paypal.com** et connecte-toi avec ton compte PayPal habituel.
2. **Apps & Credentials** → onglet **Live** → **Create App** (nom : `MYBOARD`, type : Merchant).
3. Dans l'app, descends jusqu'aux fonctionnalités et coche **Transaction search**. Enregistre.
4. Copie le **Client ID** et le **Secret**.
5. Dans les Propriétés du script, ajoute :
   - Propriété : `PAYPAL_NOMDUBUSINESS`
   - Valeur : `CLIENTID:SECRET` (les deux collés, séparés par deux-points)

*PayPal met jusqu'à 3 heures à rendre une transaction disponible : c'est normal.*

## Étape 6 — Instagram et Publicités Meta (5 min)

Il faut que ton compte Instagram soit **professionnel** et relié à une **Page Facebook**.

1. Sur **https://developers.facebook.com** → **Mes apps → Créer une app**, de type **Entreprise** (nom : `MYBOARD`). Gratuit.
2. Sur **https://business.facebook.com** → **Paramètres → Utilisateurs → Utilisateurs système → Ajouter**. Nom : `MYBOARD`, rôle : Admin.
3. Clique sur **Ajouter des éléments** et donne-lui accès à ta **Page Facebook**, ton **compte Instagram** et ton **compte publicitaire**.
4. Clique sur **Générer un token**. Choisis l'app `MYBOARD`, une expiration **Jamais**, et coche :
   `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `ads_read`, `business_management`.
5. Dans les Propriétés du script, ajoute :
   - Propriété : `META_TOKEN`
   - Valeur : le token copié

## Étape 7 — Systeme.io : le code de suivi (2 min)

1. Dans MYBOARD : **Paramètres → Connexions → Copier le code**.
2. Dans Systeme.io, colle-le dans le champ **Code de suivi** (dans l'en-tête) de tes tunnels : réglages du tunnel ⚙, ou réglages généraux pour tous tes tunnels.
3. Dans MYBOARD, vérifie que chaque **étape de tunnel a bien son lien** (adresse de la page) : c'est ainsi que l'application reconnaît les pages.

Dans tes **publicités Meta**, colle dans « Paramètres d'URL » :

```
utm_source=publicite-meta&utm_medium=publicite&utm_campaign={{campaign.name}}
```

Pour une **collaboration**, utilise le **lien de suivi** généré dans la fiche de la campagne.

---

## Vérifier que tout marche

Dans Apps Script, choisis la fonction **`chaqueHeure`** puis **▶ Exécuter** : la collecte se lance tout de suite. Ensuite, dans MYBOARD → **Connexions → Actualiser maintenant**.
- Les comptes détectés apparaissent dans **Comptes reliés**. Si tu as plusieurs entreprises, choisis à laquelle appartient chacun.
- En cas de souci, les messages d'erreur s'affichent en bas de l'écran Connexions (et dans l'onglet **Journal** de la feuille Google « MYBOARD Studio – Collecteur »).

## Ce qui se passe ensuite, sans rien faire

| Donnée | Où elle arrive dans MYBOARD |
|---|---|
| Chaque vente Stripe / PayPal | Finances → Revenus (une ligne par vente, remboursements déduits) |
| Commissions Stripe / PayPal | Finances → Dépenses (« Frais Stripe », « Frais PayPal ») |
| Ventes d'une offre | Tunnels → Performances (reconnues par les « mots-clés des ventes » du tunnel) |
| Visites, clics, sources | Tunnels → Performances et Marketing |
| Campagnes Meta | Tunnels → Marketing (coût, ROAS) + Finances → Dépenses (par mois) |
| Publications Instagram | Réseaux sociaux : marquées « Publiée », avec vues, portée, j'aime… |

## Bon à savoir

- **Gratuit** : Apps Script, Sheets et Drive sont inclus dans ton compte Google. Google limite le nombre d'appels, mais largement au-delà d'un usage normal. Ces limites peuvent évoluer.
- **Mise à jour du code** : si une nouvelle version de `Code.gs` est fournie, colle-la, enregistre, puis **Déployer → Gérer les déploiements → ✏ → Nouvelle version**. L'URL ne change pas.
- **Vie privée** : le code de suivi n'enregistre aucune donnée personnelle (un identifiant aléatoire, la page, la source). Mentionne la mesure d'audience dans la politique de confidentialité de ton site.
