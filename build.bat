@echo off
echo ================================
echo Building OceanGuard Application
echo ================================
echo.

echo Step 1: Building Frontend...
cd OceanFrontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b %errorlevel%
)
echo Frontend build complete!
echo.

echo Step 2: Building Backend...
cd ..\oceanbackend
call npm install
call npm run build:backend
if %errorlevel% neq 0 (
    echo Backend build failed!
    exit /b %errorlevel%
)
echo Backend build complete!
echo.

echo ================================
echo Build Complete!
echo ================================
echo.
echo To start the server:
echo   cd oceanbackend
echo   npm start
echo.
echo Server will run at: http://localhost:3000
echo.
