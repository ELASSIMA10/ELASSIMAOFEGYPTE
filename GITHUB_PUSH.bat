@echo off
echo =======================================
echo   EL ASSIMA EGYPT - GITHUB SETUP
echo =======================================
git init
git add .
git commit -m "Initial commit for EL ASSIMA EGYPT"
echo.
echo Tentative de creation du depot GitHub...
gh repo create ELASSIMAOFEGYPTE --public --source=. --push
echo.
echo =======================================
echo   TERMINE ! Votre projet est sur GitHub.
echo =======================================
pause
