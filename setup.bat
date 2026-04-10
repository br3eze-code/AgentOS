@echo off
echo Installing required dependencies...
call npm install --workspace=packages/agents @octokit/rest pdf-lib pdfjs-dist
call npm install --workspace=packages/agents -D @types/pdfjs-dist
echo Running full system build...
call npm run build

echo Linking agentos CLI globally...
cd packages\cli
call npm link
cd ..\..

echo Adding project root to user PATH environment variable...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=[Environment]::GetEnvironmentVariable('Path', 'User'); $d=(Get-Location).Path; if ($p -notmatch [regex]::Escape($d)) { [Environment]::SetEnvironmentVariable('Path', $p + ';' + $d, 'User'); Write-Host 'Added project root to PATH.' } else { Write-Host 'Project root already in PATH.' }"

echo Setup complete! Please completely close and RESTART your terminal for the new PATH to take effect.
