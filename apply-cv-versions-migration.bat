@echo off
echo ========================================
echo  Aplicar Migracion CV Versions
echo ========================================
echo.
echo Este script aplicara la migracion de CV Versions a tu base de datos.
echo.
echo Asegurate de tener Supabase CLI instalado y configurado.
echo.
pause

echo.
echo Aplicando migracion...
echo.

cd /d "%~dp0"
supabase db push

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  EXITO! Migracion aplicada correctamente
    echo ========================================
    echo.
    echo Ahora puedes:
    echo 1. Refrescar tu navegador
    echo 2. Ir a Dashboard ^> CV Versions
    echo 3. Crear tu primera version de CV
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR al aplicar la migracion
    echo ========================================
    echo.
    echo Por favor:
    echo 1. Verifica que Supabase CLI este instalado
    echo 2. Ejecuta: supabase login
    echo 3. Ejecuta: supabase link
    echo 4. Intenta de nuevo
    echo.
    echo O usa Supabase Dashboard:
    echo https://app.supabase.com
    echo.
)

pause
