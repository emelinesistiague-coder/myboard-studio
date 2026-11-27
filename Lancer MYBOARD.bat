@echo off
cd /d "%~dp0"
start "" http://localhost:8642
node serveur.js
