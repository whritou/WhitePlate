# WhitePlate — Design system

Version **1.1.0**, 6 octobre 2026. Direction : **Porcelaine, encre et sauge**.

Ce document est la référence normative pour toute création ou modification d’interface WhitePlate. La palette clair/sombre, les polices système, les rayons et les primitives partagées sont appliqués au frontend dans `feat/design-system-adoption`. Les écrans d’authentification, de gestion, de cuisine et de commande utilisent ces styles. Les règles de comportement décrivent aussi les exigences à conserver lors des futures évolutions ; cette adoption visuelle ne modifie pas l’autorisation, les transitions de commande ni le retry checkout.

[Aperçu visuel](overview.svg) · [Tokens structurés](tokens.json) · [Vérificateur et générateur de l’aperçu](verify.py) · [Architecture frontend](../architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) · [Conventions d’implémentation](../architecture/frontend-conventions.md) · [Tâche GitHub #28](https://github.com/whritou/WhitePlate/issues/28)

## 1. Brief et principes

WhitePlate aide des restaurateurs à gérer leurs établissements, leur carte et leur équipe, accompagne la cuisine pendant le service et permet aux clients de commander à emporter. Le système doit rendre une commande, son état et l’action suivante compréhensibles rapidement, sur téléphone comme sur écran de cuisine.

La direction évoque une assiette blanche, l’encre d’une carte et une fiche de service structurée. Le thème clair associe un blanc cassé neutre à des boutons bleus. Le thème sombre associe des gris très foncés de type stone à un accent vert sauge, choisi par l’utilisateur ; les fonds ne sont plus bleutés. Les statuts gardent des fonds et libellés dédiés : vert menthe pour Prête, ambre pour l’attente, sable pour la préparation en sombre, rouge pour les erreurs et annulations. L’accent de navigation sauge ne remplace pas ces statuts.

1. **Le contexte avant l’action.** Montrer l’établissement ou l’organisation concernés, puis le titre, puis les actions disponibles.
2. **Lisible pendant le service.** Quantités, libellés, références et actions priment sur les effets visuels. Les textes essentiels restent visibles.
3. **Une intention par accent.** Bleu pour agir/naviguer, couleurs sémantiques pour informer. Une action principale par zone de décision.
4. **Densité adaptée, langage commun.** Gestion structurée, cuisine immédiatement lisible, menu client plus aéré ; mêmes composants et mêmes significations.
5. **Confiance par le retour d’état.** Chargement, absence de données, panne, interdiction, conflit et réussite sont distingués.
6. **Identité discrète.** Les photos et la marque du restaurant peuvent prendre la place principale sur sa vitrine ; WhitePlate structure l’expérience.

### Choix et alternatives

Une évolution de l’orange actuel aurait limité la migration, mais conservé une proximité entre marque et alerte. Une direction gastronomique à sérifs et textures aurait favorisé la vitrine au détriment des formulaires et de la cuisine. Porcelaine, encre et sauge apporte une identité commune aux trois usages, sans imiter une carte de restaurant dans chaque écran de gestion. Après revue du rendu, l’utilisateur a demandé des fonds plus neutres et choisi le vert sauge pour l’accent sombre ; la version 1.1 conserve les boutons bleus du clair et adopte cette correction.

Les skills `brainstorming`, `frontend-design` et `ui-ux-pro-max` ont guidé le cadrage, la critique visuelle et les règles d’interaction. Les deux recherches locales « restaurant operations dashboard » et « restaurant management » ont renvoyé une structure de landing page et une paire de polices de menu : ces éléments ne conviennent pas à l’espace métier et ne sont pas repris. Les recommandations vérifiées sur la hiérarchie fonctionnelle et les erreurs de formulaire ont alimenté ce document. La palette finale est un choix spécifique à WhitePlate.

## 2. État constaté et portée

Audit initial avant migration au 6 octobre 2026, sur la branche issue de `fix/workspace-mobile-toast-label` (trace historique) :

| Élément | Avant migration | Cible du système |
| --- | --- | --- |
| Couleurs | Primaire orange, gris stone en OKLCH dans `app/globals.css` | Boutons bleus en clair, stone/sauge en sombre, surfaces neutres et états dédiés |
| Typographie | Arial pour corps et titres, aucune police téléchargée | Stack système commençant par Segoe UI, tailles et rôles explicites |
| Boutons | Base UI `base-lyra`, rectangulaires, hauteur 24–36 px selon taille | Rayons 8 px, cible interactive 44 px, 48 px en cuisine/checkout |
| Surfaces | Card carrée ; arrondis ajoutés localement, dont tickets `rounded-2xl` | Contrôles 8 px, cartes 12 px, overlays 16 px |
| Navigation | Sidebar 256 px dès 768 px, appbar 64 px, Sheet mobile | Même structure ; sélection bleue et noms de groupes en casse phrase |
| Feedback | Alert inline, toast succès 6 s/maximum 3, skeletons par route | Conserver le fonctionnement ; harmoniser tokens, tailles et états |
| Cuisine | Liste/grille de tickets, filtre d’état, REST + hints SignalR | Tickets structurés ; aucune obligation d’ajouter un kanban ou du drag-and-drop |
| Marque restaurant | Aucun thème par restaurant branché à l’exécution | Limites de personnalisation définies pour une future feature séparée |

Les valeurs JSON sont la **référence canonique**, recopiée dans `app/globals.css` et exposée par `@theme inline`. Le frontend n’importe pas le JSON côté client. Le test `app/design-tokens.test.ts`, exécuté par Vitest et la CI, bloque toute divergence de couleurs clair/sombre ou des quatre rayons communs. La source reste l’autorité sur le comportement en place ; ce document définit le design.

L’adoption harmonise boutons/champs de 44 px minimum (48 px pour les grandes actions), focus opaque de 2 px avec décalage de 2 px, cartes de 12 px, overlays de 16 px, badges de 14 px, variantes sémantiques et labels désactivés sans baisse d’opacité. Les surcharges locales de contrôles sont retirées. La cuisine affiche une grille fluide, les cinq statuts avec icône et texte, et une variante destructrice pour Annuler. La sidebar utilise la casse phrase et une sélection bleue ; l’appbar opaque peut revenir à la ligne sur petit écran.

Le parcours public et la connexion sont vérifiés dans le navigateur ; les composants de gestion/cuisine le sont dans une fixture locale sans accès aux données. L’acceptance authentifiée contre la base et la vérification du déploiement hébergé ne sont pas répétées par cette migration. Voir les résultats et limites dans [les preuves de vérification](../documentation-review.md).

## 3. Couleurs et tokens

Les valeurs exactes sont conservées dans [tokens.json](tokens.json). Les tokens sont nommés par rôle, jamais par page ou par restaurant. Les valeurs HEX sRGB facilitent la revue et le calcul de contraste ; une migration CSS peut conserver HEX ou convertir en OKLCH sans changer leur rendu.

| Rôle / token | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `background` | `#FAFAF9` | `#1C1917` | Fond de page |
| `foreground` | `#172B3A` | `#FAFAF9` | Texte principal |
| `card` | `#FFFFFF` | `#292524` | Surface de travail |
| `popover` | `#FFFFFF` | `#302B28` | Dialog, Sheet, menu flottant |
| `primary` | `#244D73` | `#B8D1AD` | Action principale, lien |
| `primary-foreground` | `#FFFFFF` | `#172316` | Texte sur bouton principal |
| `primary-hover` | `#1C3F60` | `#D0E2C8` | Hover et pression du bouton principal |
| `secondary` | `#F0F0EE` | `#3B3531` | Action secondaire |
| `muted` | `#F5F5F4` | `#34302D` | Surface inactive, skeleton |
| `muted-foreground` | `#625B54` | `#C2B9AF` | Métadonnées, aide, placeholder |
| `accent` | `#E5EFF7` | `#263527` | Sélection, item de navigation actif |
| `accent-foreground` | `#244D73` | `#B8D1AD` | Texte de sélection |
| `border` | `#D6D3D1` | `#534A43` | Séparation décorative |
| `input` | `#847A71` | `#A89F96` | Contour nécessaire pour identifier un contrôle |
| `ring` | `#275F8C` | `#B8D1AD` | Focus au clavier |
| `success` / `success-muted` | `#1D694B` / `#E8F4ED` | `#9DE1BD` / `#18362B` | Prêt, réussite persistante |
| `warning` / `warning-muted` | `#855000` / `#FFF4DA` | `#F4D18B` / `#3B2D14` | En attente, données périmées |
| `info` / `info-muted` | `#244D73` / `#E5EFF7` | `#D9C4A8` / `#3A3025` | En préparation, information |
| `destructive` / `destructive-muted` | `#B42335` / `#FDEBEF` | `#FFB4B8` / `#3B2027` | Erreur, annulation, confirmation destructive |

Les foregrounds de `card`, `popover` et `secondary` suivent le texte principal. `destructive-foreground` vaut blanc en clair et `#3B0C16` en sombre ; il sert uniquement à un bouton destructeur plein. Les tokens `sidebar-*` sont explicités dans le JSON pour s’intégrer aux noms déjà présents.

### Règles de combinaison

- Texte courant : au moins **4,5:1**. Garder ce seuil aussi pour les titres plutôt que dépendre de l’exception des grands caractères.
- Contours de contrôle et focus : au moins **3:1** avec la surface adjacente. `border` est décoratif ; employer `input` pour un champ ou bouton outline dont le contour porte l’identification.
- Un badge d’état associe le texte `success`, `warning`, `info` ou `destructive` au fond `*-muted`. Il garde un libellé lisible et, si utile, une icône. Ne jamais utiliser sa couleur seule.
- Un bouton secondaire utilise `secondary-foreground` sur `secondary`, avec contour `input` si sa forme doit être distinguée de la surface. Au hover, contour `ring` ; pas de changement d’opacité du texte.
- Focus de 2 px, offset de 2 px rempli par la surface locale. Sur un bouton plein, cet espace rend l’anneau distinct du bouton ; ne pas coller l’accent et l’anneau de même couleur sans séparation.
- Les états désactivés conservent le texte principal ou secondaire, sans `opacity-50` sur l’ensemble. Ajouter attribut disabled, fond muted et explication voisine lorsque la cause n’est pas évidente.
- Ne pas fabriquer des états en ajoutant `/50`, une transparence ou un `color-mix` non vérifié. Les combinaisons translucides nécessitent un calcul après composition sur le fond réel.
- Les surfaces sont opaques. Éviter gradients décoratifs, glassmorphism, halos et cartes dont chaque état utilise une nouvelle couleur.

Le vérificateur contrôle les paires prévues dans les deux thèmes, y compris hover, métadonnées, badges, focus et contours. Il ne prouve pas l’accessibilité des pages rendues.

### Contraste texte / fond des boutons et badges

Contrastes sRGB calculés sur les fonds opaques du JSON ; seuil de **4,5:1 pour chaque libellé**, quelle que soit la taille du bouton/badge. Le bouton sauge du sombre utilise un texte vert très foncé `#172316` ; son contraste est calculé, sans supposer que le blanc convient à un accent clair.

| Cas | Texte / fond | Clair | Sombre |
| --- | --- | --- | --- |
| Bouton principal | primary-foreground / primary | 8,81:1 | 9,90:1 |
| Bouton principal hover/pressed | primary-foreground / primary-hover | 10,88:1 | 11,95:1 |
| Bouton secondaire | secondary-foreground / secondary | 12,75:1 | 11,56:1 |
| Bouton outline au repos | foreground / card | 14,55:1 | 14,52:1 |
| Bouton ghost au survol | foreground / muted | 13,34:1 | 12,51:1 |
| Bouton destructeur doux / badge Annulée | destructive / destructive-muted | 5,66:1 | 8,77:1 |
| Confirmation destructive pleine | destructive-foreground / destructive | 6,50:1 | 9,98:1 |
| Badge En attente | warning / warning-muted | 6,11:1 | 9,13:1 |
| Badge En préparation | info / info-muted | 7,56:1 | 7,62:1 |
| Badge Prête | success / success-muted | 5,86:1 | 8,70:1 |
| Badge Terminée / badge neutre | muted-foreground / muted | 6,12:1 | 6,75:1 |

Le bouton secondaire utilise foreground/muted au survol ; le destructeur doux conserve sa paire texte/fond et renforce son contour. Les liens de navigation et badges sélectionnés utilisent accent-foreground/accent, jamais primary-foreground/accent. Disabled et pending ne réduisent pas l’opacité du libellé ; le contraste reste mesurable sur la paire de tokens choisie. Pour un futur accent restaurant, recalculer toutes ces paires, y compris survol, avant application. Les primitives utilisent désormais des fonds opaques et aucune baisse d’opacité du libellé ; conserver cette règle lors des futures modifications.

## 4. Typographie et données

Stack cible corps et titres : `"Segoe UI", "Helvetica Neue", Arial, sans-serif`. Elle reste locale, supporte le français et l’anglais et évite toute dépendance réseau. Ne pas installer de police pour appliquer ce système. Le monospace reste réservé aux exemples techniques dans la documentation ; aucun UUID ou prix n’en a besoin dans l’UI.

| Rôle | Taille rem (px à racine 16 px) | Interligne | Graisse |
| --- | --- | --- | --- |
| Caption non essentielle | 0,75 (12) | 1,5 | 400–500 |
| Aide, métadonnée, navigation gestion | 0,875 (14) | 1,5 | 400–600 |
| Corps, champ, bouton, produit | 1 (16) | 1,5 | 400 / 600 pour action |
| Quantité et référence cuisine | 1,125 (18) | 1,4 | 600 |
| Titre de section | 1,25 (20) | 1,3 | 600 |
| Titre de page mobile | 1,5 (24) | 1,25 | 600 |
| Titre de page desktop | 2 (32) | 1,2 | 600 |
| Nom restaurant sur vitrine | 2 à 2,5 (32–40) | 1,2 | 600 |

Utiliser un vrai `h1` par page et des `h2`/`h3` sans sauter de niveau. `CardTitle` rend actuellement un div : y placer une vraie balise de titre. Alignement gauche et casse phrase ; pas de groupes de navigation en capitales espacées. Tracking normal sur le corps, jusqu’à `-0.02em` pour les grands titres uniquement.

Limiter le texte descriptif à 65–75 caractères par ligne. Ne pas tronquer un nom de plat, une option, une erreur ou un total. Les longs noms d’organisation peuvent être tronqués dans la barre si leur valeur complète est accessible ailleurs sur la page ; un tooltip seul ne suffit pas sur mobile.

Prix et quantités : chiffres tabulaires, prix alignés à droite dans les listes, quantité avant le plat. Utiliser `Intl.NumberFormat` et la devise du restaurant, jamais un symbole codé en dur. Dates via `Intl.DateTimeFormat` et `<time dateTime>`. Ne pas transformer la locale en devise. Référence courte de commande lisible avec son libellé ; conserver la référence serveur complète dans le reçu lorsque disponible.

## 5. Espacement, forme et profondeur

Base de 4 px : **4, 8, 12, 16, 20, 24, 32, 40, 48, 64**. Valeurs en rem dans le JSON ; pas de hauteur fixe sur les zones de texte.

| Relation | Valeur cible |
| --- | --- |
| Label → champ ; icône → texte | 8 px |
| Champ → aide/erreur | 4–8 px |
| Champs d’un formulaire | 20–24 px |
| Actions voisines | 8–12 px |
| Padding carte/ticket | 20 px gestion, 24 px client ; 16 px minimum mobile |
| En-tête → contenu de page | 24–32 px |
| Sections de page | 32 px gestion ; 40 px vitrine |
| Marges de page | 16 px mobile ; 24 px dès sm ; 32 px dès lg |

Rayons : 4 px petit marqueur, **8 px contrôle**, **12 px carte**, **16 px dialog/Sheet/toast**. Pill uniquement pour un badge, filtre ou compteur ; pas pour tous les boutons. Les fiches de commande ressemblent à des objets de travail, pas à des bulles.

La hiérarchie vient des surfaces et du contenu. Pas d’ombre sur les listes ou cartes ordinaires. Ombre overlay uniquement : clair `0 8px 24px rgb(23 43 58 / 12%)`, sombre `0 8px 24px rgb(0 0 0 / 32%)`. Le fond d’un overlay peut assombrir la page ; son texte reste sur une surface opaque.

Échelle de z-index : contenu 0, sticky 30, overlay 40, toast 50, skip link 60. Un toast ne masque jamais l’action de confirmation ni le bouton de fermeture d’une modal ; vérifier leur placement ensemble.

## 6. Mise en page et responsive

Breakpoints conservés de Tailwind : sm 640, md 768, lg 1024, xl 1280, 2xl 1536 px. Les règles ci-dessous sont des comportements, pas des modèles de téléphone.

### Gestion

- Sidebar de 16 rem dès md ; en dessous, déclencheur 44 × 44 px et Sheet. Si les libellés ne tiennent pas au zoom, repasser au menu mobile plutôt que cacher les noms.
- Appbar d’au moins 4 rem, contexte à gauche, langue/thème/compte à droite. Elle peut prendre plusieurs lignes sur petit écran.
- Contenu jusqu’à 80 rem hors sidebar, largeur fluide et `min-width: 0`. Formulaire simple jusqu’à 40 rem ; auth jusqu’à 28 rem.
- Une ligne titre/description/action, puis sections fonctionnelles. Les listes utilisent lignes et séparateurs ; les Card encadrent une tâche ou un groupe, pas chaque texte.
- Éditeur catalogue : catégories, produits, groupes d’options et remises conservent leurs relations explicites. Une présentation en deux colonnes n’est admise que si chaque panneau garde au moins 20 rem ; sinon empiler.

### Cuisine

- Filtres au-dessus des tickets ; retour connexion près du titre sans dominer les commandes.
- Grille fluide, ticket minimum 18 rem ; une colonne lorsque la place manque. Ordre de lecture identique à l’ordre DOM.
- Actions de 48 px minimum ; quantité/référence à 18 px, ingrédients/options à 16 px. Les états sont identifiables sans couleur.
- Garder la présentation et le tri métier existants. Pas de déplacement automatique de focus, de drag-and-drop imposé ou de tickets qui sautent hors de la vue pendant une action.

### Vitrine et commande

- Jusqu’à 72 rem ; menu à gauche et panier de 22 rem dès lg lorsque les deux restent lisibles. En dessous, panier dans le flux après le menu ; un raccourci vers ce panier peut être ajouté dans une tâche UI ciblée.
- Restaurant, langue du menu, catégories, plats et prix structurent la page. Aucun faux badge « populaire », temps de préparation ou note inventée.
- Une éventuelle barre panier sticky laisse un padding inférieur égal à sa hauteur et au safe area. Elle ne recouvre ni champ ni focus ; le reçu garde une place normale dans le flux.
- Auth et onboarding suivent une colonne calme, logo/nom, titre, aide courte, formulaire, navigation secondaire. Aucun décor à droite obligatoire.

Vérifier à **320, 375, 768, 1024 et 1440 px**, zoom 200 %, texte agrandi et reflow à 400 %. Aucun scroll horizontal de page. Une table réellement bidimensionnelle peut avoir son propre scroll nommé ; les formulaires et tickets s’empilent. Éviter des boutons en `whitespace-nowrap` qui débordent : autoriser le retour à la ligne et une hauteur minimale.

## 7. Composants et contrats visuels

Réutiliser `apps/frontend/components/ui` avec Base UI. Le style installé `base-lyra` est une base technique ; sa couleur orange, ses angles carrés et ses petites tailles ne définissent pas l’identité cible. Ne pas remplacer la librairie ni supposer une API Radix `asChild`.

### Boutons et liens

| Intention | Variante existante à faire évoluer | Aspect cible |
| --- | --- | --- |
| Action principale | `default` | Fond primary, texte primary-foreground, hover primary-hover |
| Action secondaire | `outline` | Fond card, texte foreground, contour input |
| Action moins importante | `secondary` | Fond secondary, texte secondary-foreground |
| Action utilitaire | `ghost` | Texte foreground, hover muted ; pas pour validation principale |
| Destruction | `destructive` | Texte destructive sur destructive-muted ; bouton plein seulement dans confirmation si utile |
| Navigation textuelle | Lien normal / `link` | Primary, souligné dans le texte ; focus visible |

Hauteur minimum **44 px**, padding horizontal 16 px, texte 16 px ; **48 px** en cuisine/checkout. Une taille compacte de 36 px peut exister en gestion desktop seulement si la cible effective reste 44 px sans recouvrir ses voisines. Les badges non interactifs peuvent être plus petits.

États requis : repos, hover, pressed, focus-visible, disabled, pending. Un pending conserve la largeur, nomme l’action (« Enregistrement… »), empêche le doublon et expose `aria-busy`. Une icône de chargement ne remplace pas le texte. Un lien stylé comme un bouton utilise le `render` Base UI existant ; un bouton déclenchant une mutation reste un vrai bouton.

### Champs et choix

`Input`, `Textarea`, `Label`, `NativeSelect`, `Checkbox` et `RadioGroup` restent les primitives. Label toujours visible, unité/devise et contraintes avant saisie si elles aident. Placeholder = exemple, jamais label. Hauteur champ 44 px, texte 16 px, contour input, focus ring. Textarea minimum 3 lignes avec redimensionnement vertical.

Label associé via id ; aide/erreur par `aria-describedby`, erreur via `aria-invalid`. Après soumission invalide, focus sur un résumé relié aux champs si plusieurs erreurs, sinon sur le champ invalide. Conserver les valeurs. Pas de toast comme seul message d’erreur. Ne pas voler le focus au blur.

Checkbox/radio : indicateur visible, label et zone de clic de 44 px ; nom accessible explicite pour les primitives custom. Montrer pour les options produit le nombre requis/maximum et le supplément dans la devise du menu. Utiliser `selectClassName` pour styler l’élément NativeSelect, `className` pour son wrapper.

### Surfaces, listes et navigation

- Card complète : Header/Title/Description/Content/Footer lorsqu’ils sont utiles. Liste sémantique et vrais titres à l’intérieur ; pas de Card imbriquée sans fonction distincte.
- Ligne de liste : nom, informations secondaires, état, action ; alignement constant. Les petites actions ont des noms qui incluent l’objet concerné.
- Navigation active : accent + accent-foreground, graisse 600, `aria-current="page"`. Grouper par organisation/restaurant avec casse phrase ; préserver les liens filtrés par les records serveur.
- Filtre d’état : libellé, valeur sélectionnée persistante et accès clavier ; si plusieurs boutons, état pressé explicite. Ne pas annoncer de faux compteur global si seule une page est chargée.
- Tables : en-têtes et caption, alignement numérique à droite, action nommée. Sur mobile, cartes/lignes descriptives ou scroll contenu ; aucune colonne métier silencieusement supprimée.

### Badge et état de commande

Badge = 14 px/500, padding 4 × 8 px, pill, texte complet. Il ne reçoit pas le focus s’il n’est pas interactif. `Badge` fournit les variantes `warning`, `info`, `success`, `neutral` et `destructive` utilisées par les tickets.

| Valeur API actuelle | FR | EN | Paire de tokens | Icône Lucide possible |
| --- | --- | --- | --- | --- |
| `Pending` | En attente | Pending | warning / warning-muted | Clock |
| `Preparing` | En préparation | Preparing | info / info-muted | CookingPot |
| `Ready` | Prête | Ready | success / success-muted | Check |
| `Completed` | Terminée | Completed | muted-foreground / muted | CheckCheck |
| `Cancelled` | Annulée | Cancelled | destructive / destructive-muted | X |

Ce mapping ne crée pas de statut ni de transition. Les droits et transitions restent ceux de `getAvailableOrderTransitions` et de l’API. Disponibilité catalogue, invitation en attente/expirée et connexion utilisent leurs propres libellés, même lorsqu’ils réemploient une paire de couleurs.

### Dialog, Sheet, Alert et toast

- Sheet mobile : titre et description accessibles, scroll interne, Escape, confinement/restauration du focus fournis par Base UI ; largeur maximum 20 rem sans déborder du viewport.
- AlertDialog : titre avec l’objet, conséquences exactes, Annuler + action explicite. Focus initial sur l’action sûre pour destruction ; retour au déclencheur. Respecter le blocage pending déjà implémenté ; une erreur laisse le dialog ouvert.
- Alert : message persistant, cause compréhensible et action possible. Danger pour erreur bloquante, warning pour stale, info pour information ; rôle d’annonce adapté, sans région live dupliquée.
- Toast : succès bref uniquement, durée actuelle 6 s et maximum 3 conservés. Région polie nommée par label invisible, bouton Fermer accessible, aucun déplacement de focus. Pas de notification pour chaque événement SignalR. Les erreurs et les reçus restent dans la page.
- Skeleton : même géométrie que le contenu attendu, décor masqué aux lecteurs d’écran, une annonce localisée, `aria-busy`, mouvement arrêté sous reduced-motion.

## 8. États et sécurité de l’expérience

| Situation | Présentation attendue | Comportement à préserver |
| --- | --- | --- |
| Première lecture | Skeleton de page, statut « Chargement… » | Ne pas afficher un vide avant résolution |
| Refresh en fond | Données en place, annonce discrète | Ne pas remplacer toute la grille par un loader |
| Aucun résultat | Phrase concrète + action pertinente | Différencier filtre vide et aucune donnée créée |
| Mutation pending | Bouton occupé et champs concernés verrouillés | Pas de clic doublé, pas de fausse réussite |
| Validation | Erreurs proches des champs | Valeurs conservées, correction guidée |
| Conflit de version | Alert explicite, rafraîchir les données serveur | Ne pas afficher une transition comme réussie |
| Reconnexion/panne cuisine | Warning près des commandes périmées | SignalR = hint ; REST reste autoritaire |
| Accès révoqué/interdit | Message sûr et navigation de sortie | Retirer les tickets ; aucune donnée stale d’un accès interdit |
| Checkout incertain | « Confirmation non reçue » + réessayer | Garder payload et clé d’essai ; champs/langue verrouillés |
| Checkout confirmé | Reçu, référence et totaux serveur | Aucune promesse de paiement ou de retrait non implémentée |

Le design ne doit jamais contourner la vérification tenant, masquer une perte d’autorisation, transformer le retry en nouvelle commande ou calculer un prix final autoritaire dans le navigateur. Aucun tenant sélectionné dans l’UI n’accorde un droit. Les labels du reçu et des tickets restent les snapshots de commande ; une refonte ne les remplace pas par la traduction actuelle du catalogue.

## 9. Icônes, images, mouvement et visualisation

Lucide React déjà installé : SVG 16 px dans une métadonnée, 20 px pour contrôle, 24 px seulement si nécessaire. Stroke cohérent, icône décorative `aria-hidden`. Une action uniquement iconographique reçoit un nom traduit et une cible 44 px. Aucune emoji comme pictogramme de produit ou statut.

Pas d’image de plat inventée. Si une future feature fournit de vraies photos, cadrage 4:3, proportions réservées, alt utile si l’image apporte une information ; sinon alt vide lorsque le nom voisin suffit. Une absence d’image reste une ligne de menu propre, pas une illustration placeholder imposée. Aucun téléchargement ni champ image n’est ajouté par cette spécification.

Durées : feedback 120 ms, disclosure 180 ms, overlay 220 ms ; easing `cubic-bezier(0.2, 0, 0, 1)`. Motion uniquement pour une action ou un changement compréhensible. Pas de bounce, parallax, compteurs animés ou entrée de chaque ticket. Focus et mise à jour ARIA immédiats. Sous `prefers-reduced-motion: reduce`, transitions et pulses passent à 0 ; état final intact.

Aucun module analytics n’est créé. Si un graphique est demandé plus tard, lui donner un titre, unité, période, légende, valeurs accessibles et alternative tabulaire ; distinguer les séries par forme/libellé en plus de la couleur. Aucun token `chart-*` n’est exposé par le thème actuel ; définir une palette dans la tâche graphique concernée.

## 10. Langue et microcopy

L’interface reste FR/EN via `next-intl`, clés et interpolations identiques dans les deux catalogues. La langue du menu, la langue de l’interface et la devise sont indépendantes. Appliquer `lang` aux labels sauvegardés et au menu comme aujourd’hui. Prévoir des libellés 30 % plus longs ; ne pas réduire le texte pour faire tenir une traduction.

| Intention | FR | EN |
| --- | --- | --- |
| Sauver une modification | Enregistrer les modifications | Save changes |
| Ajouter un plat | Ajouter au panier | Add to cart |
| Envoyer la commande | Confirmer la commande | Place order |
| Confirmation incertaine | La confirmation n’a pas été reçue. Réessayez pour vérifier cette commande. | Confirmation was not received. Retry to check this order. |
| Données périmées | Les commandes affichées peuvent ne plus être à jour. | These orders may be out of date. |
| Conflit | Cette commande a changé. Actualisez avant de réessayer. | This order has changed. Refresh before trying again. |
| Catalogue vide | Aucun produit. Ajoutez votre premier produit. | No products yet. Add your first product. |

Ces exemples sont des recommandations de formulation, pas des clés déjà ajoutées. Employer les clés existantes lorsque leur sens est correct ; toute modification doit être appliquée aux deux catalogues. Bouton et feedback utilisent le même verbe. Éviter « Soumettre », jargon réseau, UUID comme titre, détails de serveur, faux urgence, récompenses et excuses automatiques. Une réussite ne se prétend pas terminée avant acquittement serveur.

## 11. Recettes d’écrans

Les schémas décrivent une composition cible, pas une route ou une feature nouvelle.

```text
Gestion desktop
┌───────────────────┬───────────────────────────────────────────┐
│ WhitePlate        │ Bistro du Port           FR  Thème Compte │
│ Organisation      ├───────────────────────────────────────────┤
│ Équipe            │ Catalogue               Ajouter un produit│
│ Paramètres        │ Description courte                        │
│ Bistro du Port    │ Catégories → Produits → Options → Remises │
│ Commandes         │ Nom / prix / disponibilité / modifier     │
│ Catalogue [actif] │ Formulaire dans une section distincte     │
└───────────────────┴───────────────────────────────────────────┘

Ticket cuisine
┌─────────────────────────────────────┐
│ Commande A82F         En préparation │
│ Camille · 12:42                      │
│ 2 × Sandwich poulet                 │
│     Pain complet · Sauce à part     │
│ 1 × Soupe                           │
│ Total                     23,00 €   │
│ [Marquer comme prête]               │
└─────────────────────────────────────┘

Menu mobile
Restaurant → langue du menu → catégories → plats/prix/options
→ panier (quantités et total estimé) → client / remise
→ Confirmer la commande → reçu avec montants serveur
```

**Équipe** : membres puis invitations ; rôle et restaurant explicites ; formulaire séparé ; état/expiration et révocation uniquement lorsqu’autorisé. **Paramètres** : une colonne, contexte de l’organisation, nom, aide, action de sauvegarde. **Catalogue** : distinguer édition, disponibilité et archive ; historique archivé lisible sans action de restauration inventée. **Langues** : langues activées, langue par défaut, puis traductions par élément ; ne pas modifier la langue UI en même temps. **Reçu** : confirmation, référence, lignes/options, taxes/remise/total, nouvelle commande. Aucun écran ne présente paiement, réservation, stock ou heure de retrait comme actifs.

## 12. Marque blanche : limites prévues

Le runtime actuel n’a pas de configuration de marque par restaurant. Cette section encadre son éventuelle introduction ; elle ne crée pas de réglage, DTO, table ou endpoint.

La vitrine pourrait accepter nom, logo, photos et une couleur d’accent validée via un futur contrat. Seuls primaire/hover/foreground et accent/foreground de vitrine seraient dérivés et testés dans les deux thèmes. Une couleur non conforme retombe sur le bleu WhitePlate ; jamais de texte blanc arbitraire sur une couleur claire. Aucun CSS/HTML/JS libre fourni par un tenant.

La personnalisation ne change ni statuts, focus, erreurs, taille de cible, comportement clavier, ni UI de gestion/cuisine. Les assets et thèmes restent isolés par tenant côté serveur et cache. Formats/logo/upload, stockage et validation de couleur doivent être traités dans une tâche distincte avant de rendre ce paramétrage disponible.

## 13. Adoption dans le code

Avant **chaque** changement UI, lire ce document, les tokens et la primitive existante. Identifier la surface, les états, le contexte tenant et les catalogues concernés. Appliquer le système au périmètre touché et à ses composants communs nécessaires, sans lancer une refonte des pages voisines.

1. Pour une première adoption globale, migrer les tokens dans `app/globals.css` et les exposer par `@theme inline` Tailwind 4. Réutiliser les noms existants ; ajouter hover et états dédiés avec leurs foregrounds/fonds. Mettre à jour rayons et font stacks. Lire la documentation Next installée si du code Next est touché.
2. Harmoniser les primitives `components/ui` (dimensions, focus, états, surfaces) avant d’accumuler des surcharges par écran. Les changements partagés exigent une revue de leurs usages auth/gestion/cuisine/client.
3. Appliquer les recettes aux écrans du changement demandé ; traductions FR/EN, skeleton et retours d’état font partie du même périmètre.
4. Vérifier les états critiques, thèmes, tailles d’écran, clavier et contraste ; documenter les éventuels écarts temporaires et leur carte kanban.

Le JSON n’est pas à importer côté client ou dans un service métier : il décrit le design. La CSS active reste la source exécutable. Au moment d’une migration, tenir JSON, document et CSS alignés, sans script de génération ni dépendance nouvelle si une modification directe suffit.

Une règle globale peut évoluer lorsqu’une demande produit concrète le justifie : modifier d’abord cette référence et les tokens associés, noter le motif et la portée. Une exception locale doit figurer dans le changement avec son motif, les surfaces et la vérification. Aucune exception ne supprime accessibilité ou isolation tenant. Les anciens specs restent des traces historiques et n’annulent pas ce référentiel visuel.

## 14. Vérification et règle de livraison

Référence d’accessibilité : [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Cible : niveau AA ; la cible produit de 44 px et les textes tous à 4,5:1 vont plus loin que certains minima. Cela ne constitue pas une certification de l’application.

Pour la référence documentaire, depuis la racine :

```powershell
py -3 docs/design-system/verify.py
py -3 docs/design-system/verify.py --render
git diff --check
```

`--render` régénère uniquement `overview.svg` à partir du JSON, après vérification. Sans argument, le script ne modifie rien. Python utilise seulement sa bibliothèque standard ; aucune dépendance frontend ajoutée. L’aperçu est une planche statique de conception, pas une capture de l’application.

Pour une future modification UI :

- [ ] Lire cette référence et les AGENTS applicables ; préciser les règles/états concernés dans le handoff.
- [ ] Utiliser tokens sémantiques et primitives partagées ; éviter couleurs inline et variantes concurrentes.
- [ ] Vérifier clair/sombre, FR/EN, 320/375/768/1024/1440 px, zoom et texte long.
- [ ] Tester clavier, focus visible/non masqué, noms accessibles, dialog/sheet et régions live.
- [ ] Vérifier loading/empty/error/pending/success, stale/conflit/revocation ou checkout incertain si concernés.
- [ ] Vérifier couleurs réellement rendues, transparences, survol et focus ; JSON seul insuffisant.
- [ ] Depuis `apps/frontend`, exécuter `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` selon le périmètre ; `npm run test` et couverture ciblée si comportement modifié. Ne pas lancer typecheck pendant le build.
- [ ] Enregistrer résultats et limites, mettre à jour docs et carte kanban, commit et push.

Les instructions AGENTS imposent cette revue aux agents ; elles ne constituent pas un contrôle automatique de l’esthétique par ESLint. Les contrôles actuels imposent déjà les primitives partagées. Vitest vérifie automatiquement les couleurs/rayons CSS contre le JSON ; Playwright vérifie les contrastes calculés, les états, le focus, le responsive et la taille de texte. Ces contrôles ne remplacent pas la revue visuelle des futurs écrans.

## 15. Historique

| Version | Date | Changement |
| --- | --- | --- |
| 1.0.0 — référence | 2026-10-06 | Création du référentiel initial Porcelaine et encre, tokens clair/sombre, recettes et consignes d’adoption. |
| 1.0.0 — adoption | 2026-10-06 | Application de la même palette et des règles visuelles aux primitives et écrans existants ; contrôle CI des tokens et tests navigateur. |
| 1.1.0 | 2026-10-06 | Revue utilisateur : fonds clairs neutres, bases sombres stone et accent sauge. Boutons bleus du clair conservés ; contrastes recalculés et tests navigateur relancés. |
