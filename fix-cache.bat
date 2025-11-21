@echo off
REM Script de nettoyage du cache Metro pour Windows

echo.
echo ===================================
echo  NETTOYAGE DU CACHE METRO
echo ===================================
echo.

echo 1. Arret des processus Metro...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Suppression des caches temporaires...
del /s /q "%TEMP%\metro-*" 2>nul
del /s /q "%TEMP%\haste-map-*" 2>nul
del /s /q "%TEMP%\react-native-*" 2>nul

echo 3. Nettoyage du cache npm...
call npm cache clean --force

echo 4. Nettoyage Gradle (Android)...
cd android 2>nul && gradlew.bat clean && cd .. || echo    Android non disponible

echo.
echo ===================================
echo  NETTOYAGE TERMINE !
echo ===================================
echo.
echo Pour redemarrer l application:
echo   1. npx react-native start --reset-cache
echo   2. Dans un autre terminal: npm run android
echo.
pause