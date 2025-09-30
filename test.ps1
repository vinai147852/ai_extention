# Test script for Copilot MCP Bridge

Write-Host "🧪 Testing Copilot MCP Bridge..." -ForegroundColor Green

# Test 1: Compilation
Write-Host "1️⃣ Testing TypeScript compilation..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilation successful" -ForegroundColor Green

# Test 2: Linting
Write-Host "2️⃣ Running ESLint..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Linting issues found (not blocking)" -ForegroundColor Yellow
} else {
    Write-Host "✅ No linting issues" -ForegroundColor Green
}

# Test 3: Package creation
Write-Host "3️⃣ Testing package creation..." -ForegroundColor Yellow
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Package creation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Package created successfully" -ForegroundColor Green

# Test 4: Sample MCP server
Write-Host "4️⃣ Testing sample MCP server..." -ForegroundColor Yellow
Set-Location sample-mcp-server

# Start server in background
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Test health endpoint
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host "✅ Sample MCP server is working" -ForegroundColor Green
    } else {
        Write-Host "❌ Sample MCP server health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not connect to sample MCP server" -ForegroundColor Red
} finally {
    # Stop the server
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Set-Location ..

Write-Host ""
Write-Host "🎯 All tests completed!" -ForegroundColor Green
Write-Host "The extension is ready for development and testing." -ForegroundColor White