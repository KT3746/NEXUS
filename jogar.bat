@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  NEXUS - jogo no SEU computador
echo  --------------------------------
echo  1. Deixe ESTA janela aberta enquanto jogar.
echo  2. No Chrome, abra:  http://localhost:47331
echo  3. Feche o Preview do Cursor para nao misturar com a nuvem.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  Falta o Node.js ^(o programa que liga o jogo no PC^).
  echo  Instale o botao LTS em:  https://nodejs.org
  echo  Depois rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo  Este arquivo precisa ficar DENTRO da pasta NEXUS.
  echo  Caminho esperado: Documentos\GitHub\NEXUS
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  Primeira vez: baixando as pecas. Pode levar 1 ou 2 minutos...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  npm install falhou. Veja a mensagem acima.
    pause
    exit /b 1
  )
  echo.
)

echo  Ligando o servidor...
echo  Para desligar: feche esta janela ou aperte Ctrl+C.
echo.
call npm run dev

echo.
echo  Servidor encerrou. O jogo no Chrome para de funcionar.
pause
