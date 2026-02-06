# start.ps1 - Script de demarrage UPB School
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  UPB SCHOOL - DEMARRAGE AUTOMATIQUE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Arreter les processus Node existants
Write-Host "Arret des processus Node existants..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Demarrer le backend
Write-Host ""
Write-Host "Demarrage du BACKEND..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; node server.js"

# Attendre que le backend soit pret
Start-Sleep -Seconds 3

# Demarrer le frontend
Write-Host "Demarrage du FRONTEND..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SERVEURS DEMARRES !" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ouvrez http://localhost:5173 dans votre navigateur" -ForegroundColor White
