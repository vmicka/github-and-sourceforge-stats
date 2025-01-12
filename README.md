# GitHub & Sourceforge Release Stats

Un outil web simple pour visualiser les statistiques de téléchargement des releases de projets GitHub et Sourceforge côte à côte.

## Fonctionnalités

- Affichage des statistiques de téléchargement des releases GitHub et Sourceforge
- Comparaison des téléchargements entre les deux plateformes
- Auto-complétion des noms de dépôts GitHub
- Pagination des résultats
- Affichage des informations détaillées pour chaque release :
  - Nombre de téléchargements
  - Date de publication
  - Auteur
  - Taille des fichiers
  - Badge pour les pré-releases et dernières releases

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/vmicka/github-sourceforge-release-stats.git
cd github-sourceforge-release-stats
```

2. Ouvrez `index.html` dans votre navigateur web préféré.

## Utilisation

1. Entrez le nom d'utilisateur ou de l'organisation GitHub
2. Sélectionnez le dépôt dans la liste auto-complétée
3. Entrez le nom du projet Sourceforge correspondant
4. Cliquez sur "Get the latest release stats!"

Les statistiques seront affichées en deux colonnes :
- À gauche : les statistiques GitHub
- À droite : les statistiques Sourceforge

## Dépendances

- jQuery 1.11.1
- Bootstrap 3.x

## Limitations

- L'API GitHub a des limites de taux pour les requêtes non authentifiées
- Les projets doivent exister sur les deux plateformes pour une comparaison complète
- Les noms des releases doivent correspondre entre GitHub et Sourceforge