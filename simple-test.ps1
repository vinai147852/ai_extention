Write-Host "Testing Copilot MCP Bridge Integration" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta

Write-Host "1. Checking extensions..." -ForegroundColor Yellow
$extensions = code --list-extensions
if ($extensions -match "copilot-mcp-bridge") {
    Write-Host "   ✅ MCP Bridge extension installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ MCP Bridge extension missing" -ForegroundColor Red
}

Write-Host "2. Testing MCP server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 3
    Write-Host "   ✅ MCP Server healthy on port 3000" -ForegroundColor Green
} catch {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 3
        Write-Host "   ✅ MCP Server healthy on port 3001" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ No MCP server found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 To test interception in VS Code:" -ForegroundColor Cyan
Write-Host "1. Open VS Code: code ." -ForegroundColor White
Write-Host "2. Configure endpoint: Ctrl+Shift+P -> 'Configure MCP Server'" -ForegroundColor White  
Write-Host "3. Set to: http://localhost:3000/mcp (or 3001)" -ForegroundColor White
Write-Host "4. Open Copilot Chat and type: @mcp test message" -ForegroundColor White
Write-Host "5. Check logs: Ctrl+Shift+P -> 'Show Logs'" -ForegroundColor White