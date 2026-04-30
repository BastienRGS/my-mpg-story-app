Les commandes dépendent de ton workflow. Pour ton cas (Cursor → GitHub → Vercel), voici le plus simple :
Si tu travailles directement sur main :

git add .
git commit -m "description de ce que tu as fait"
git push

Vercel redéploie automatiquement.

Si tu as travaillé sur une branche séparée :

# 1. Aller sur main
git checkout main

# 2. Récupérer les dernières modifs
git pull

# 3. Merger ta branche
git merge nom-de-ta-branche

# 4. Pousser sur GitHub
git push

Pour voir sur quelle branche tu es :
git branch