@echo off
set TS_NODE_PROJECT=%~dp0packages\cli\tsconfig.json
npx -y ts-node -T %~dp0packages\cli\src\index.ts %*
