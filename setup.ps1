# Copilot MCP Bridge - Quick Setup Script

Write-Host "🚀 Setting up Copilot MCP Bridge development environment..." -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check VS Code
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "✅ VS Code: $codeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ VS Code is not installed or not in PATH. Please install from https://code.visualstudio.com/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Compile TypeScript
Write-Host "🔨 Compiling TypeScript..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to compile TypeScript" -ForegroundColor Red
    exit 1
}

# Install recommended extensions
Write-Host "🔌 Installing recommended VS Code extensions..." -ForegroundColor Yellow
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension eamodio.gitlens
code --install-extension github.copilot

# Setup sample MCP server
Write-Host "🖥️ Setting up sample MCP server..." -ForegroundColor Yellow
Set-Location sample-mcp-server

# Kill any existing processes on port 3000
Write-Host "🔄 Checking for existing processes on port 3000..." -ForegroundColor Cyan
$processId = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if ($processId) {
    Write-Host "🛑 Stopping existing process on port 3000 (PID: $processId)" -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Failed to install sample MCP server dependencies" -ForegroundColor Yellow
} else {
    Write-Host "✅ Sample MCP server ready" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Press F5 to start debugging the extension" -ForegroundColor White
Write-Host "2. Start the sample MCP server: cd sample-mcp-server && npm start" -ForegroundColor White
Write-Host "3. Configure the extension to use http://localhost:3000/mcp" -ForegroundColor White
Write-Host "4. Test with @mcp in Copilot Chat" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: README.md" -ForegroundColor Cyan
Write-Host "🐛 Issues: https://github.com/your-team/copilot-mcp-bridge/issues" -ForegroundColor Cyan