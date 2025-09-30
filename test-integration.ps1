# Test Copilot MCP Bridge Integration
# This script helps verify that the extension is working

Write-Host "🧪 Testing Copilot MCP Bridge Integration" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# Step 1: Check VS Code Extensions
Write-Host "1️⃣ Checking VS Code Extensions..." -ForegroundColor Yellow
$extensions = code --list-extensions
$hasCopilot = $extensions -contains "GitHub.copilot"
$hasBridge = $extensions -match "copilot-mcp-bridge"

if ($hasCopilot) {
    Write-Host "   ✅ GitHub Copilot extension found" -ForegroundColor Green
} else {
    Write-Host "   ❌ GitHub Copilot extension NOT found" -ForegroundColor Red
    Write-Host "   💡 Install: code --install-extension GitHub.copilot" -ForegroundColor Yellow
}

if ($hasBridge) {
    Write-Host "   ✅ Copilot MCP Bridge extension found" -ForegroundColor Green
} else {
    Write-Host "   ❌ Copilot MCP Bridge extension NOT found" -ForegroundColor Red
}

# Step 2: Check MCP Server
Write-Host ""
Write-Host "2️⃣ Checking MCP Server..." -ForegroundColor Yellow
$serverFound = $false
$serverPort = 0

for ($port = 3000; $port -le 3005; $port++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($response.status -eq "healthy") {
            Write-Host "   ✅ MCP Server found on port $port" -ForegroundColor Green
            $serverFound = $true
            $serverPort = $port
            break
        }
    } catch {
        # Server not on this port, continue
    }
}

if (-not $serverFound) {
    Write-Host "   ❌ No MCP Server found" -ForegroundColor Red
    Write-Host "   💡 Start server: cd sample-mcp-server && npm start" -ForegroundColor Yellow
}

# Step 3: Test MCP Endpoint
if ($serverFound) {
    Write-Host ""
    Write-Host "3️⃣ Testing MCP Endpoint..." -ForegroundColor Yellow
    
    try {
        $testRequest = @{
            prompt = "TEST: This is a test message to verify interception works"
            sessionId = "test-session"
            userId = "test-user"
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            context = @{
                activeFile = @{
                    path = "test.js"
                    language = "javascript"
                    content = "// Test file"
                }
            }
            metadata = @{
                extensionVersion = "1.0.0"
                vscodeVersion = "test"
            }
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "http://localhost:$serverPort/mcp" -Method Post -Body $testRequest -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "   ✅ MCP endpoint responding correctly" -ForegroundColor Green
            Write-Host "   📝 Enhanced prompt: $($response.data.enhancedPrompt)" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ MCP endpoint returned error" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Failed to test MCP endpoint: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 4: Instructions for VS Code Testing
Write-Host ""
Write-Host "4️⃣ How to Test in VS Code:" -ForegroundColor Yellow
Write-Host "   1. Open VS Code: code ." -ForegroundColor White
Write-Host "   2. Press Ctrl+Shift+P and run:" -ForegroundColor White
Write-Host "      'Copilot MCP Bridge: Configure MCP Server Settings'" -ForegroundColor Cyan
Write-Host "   3. Set endpoint to: http://localhost:$serverPort/mcp" -ForegroundColor Cyan
Write-Host "   4. Open Copilot Chat (Ctrl+I or Chat panel)" -ForegroundColor White
Write-Host "   5. Type: @mcp Hello, can you help me?" -ForegroundColor Cyan
Write-Host "   6. Check logs: Ctrl+Shift+P -> 'Copilot MCP Bridge: Show Logs'" -ForegroundColor White

# Step 5: Debug Information
Write-Host ""
Write-Host "5️⃣ Debug Information:" -ForegroundColor Yellow
Write-Host "   📁 Extension Location: %USERPROFILE%\.vscode\extensions" -ForegroundColor White
Write-Host "   📊 MCP Server Status: http://localhost:$serverPort/status" -ForegroundColor White
Write-Host "   🔧 Configuration: VS Code Settings -> 'copilot-mcp-bridge'" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Expected Results:" -ForegroundColor Green
Write-Host "   • Extension logs show 'MCP request received'" -ForegroundColor White
Write-Host "   • Chat shows enhanced/modified response" -ForegroundColor White
Write-Host "   • MCP server logs show incoming requests" -ForegroundColor White

Write-Host ""