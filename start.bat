@echo off
echo ================================
echo Starting OceanGuard Server
echo ================================
echo.
echo Server starting at: http://localhost:3000
echo Press Ctrl+C to stop
echo.
cd oceanbackend
set NODE_ENV=production
node dist/index.js
