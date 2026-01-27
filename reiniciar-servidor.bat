@echo off
echo ================================================
echo REINICIANDO SERVIDOR CON CACHE LIMPIO
echo ================================================
echo.

cd /d "%~dp0"

echo [1/3] Limpiando cache de Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo     Cache eliminado correctamente
) else (
    echo     No hay cache para eliminar
)
echo.

echo [2/3] Iniciando servidor de desarrollo...
echo     Presiona CTRL+C para detener el servidor
echo.

npm run dev
