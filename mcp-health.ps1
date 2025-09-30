# MCP Server Health Check Script
param(
    [switch]$Stop,
    [switch]$Start,
    [switch]$Restart,
    [int]$Port = 3000
)

function Test-McpServer {
    param([int]$TestPort)
    
    try {
        Write-Host "🔍 Testing MCP server on port $TestPort..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "http://localhost:$TestPort/health" -Method Get -TimeoutSec 5
        
        if ($response.status -eq "healthy") {
            Write-Host "✅ MCP server is healthy on port $TestPort" -ForegroundColor Green
            Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
            Write-Host "   Uptime: $([math]::Round($response.uptime, 2)) seconds" -ForegroundColor Cyan
            return $true
        }
    } catch {
        Write-Host "❌ MCP server not responding on port $TestPort" -ForegroundColor Red
        return $false
    }
}

function Stop-McpServer {
    param([int]$StopPort)
    
    Write-Host "🛑 Stopping processes on port $StopPort..." -ForegroundColor Yellow
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $StopPort -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                
                if ($process) {
                    Write-Host "🔥 Killing process: $($process.Name) (PID: $processId)" -ForegroundColor Red
                    Stop-Process -Id $processId -Force
                }
            }
            Write-Host "✅ Stopped all processes on port $StopPort" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ No processes found on port $StopPort" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠️ Error stopping processes: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Start-McpServer {
    Write-Host "🚀 Starting MCP server..." -ForegroundColor Yellow
    
    Push-Location -Path "sample-mcp-server" -ErrorAction SilentlyContinue
    
    if (Test-Path "server.js") {
        $process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Minimized
        Write-Host "✅ Started MCP server (PID: $($process.Id))" -ForegroundColor Green
        
        # Wait a moment for server to start
        Start-Sleep -Seconds 3
        
        # Test multiple ports to find where it's running
        $found = $false
        for ($testPort = 3000; $testPort -le 3005; $testPort++) {
            if (Test-McpServer -TestPort $testPort) {
                $found = $true
                Write-Host "💡 Configure your extension to use: http://localhost:$testPort/mcp" -ForegroundColor Cyan
                break
            }
        }
        
        if (-not $found) {
            Write-Host "⚠️ Server started but not responding on expected ports" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ server.js not found. Make sure you're in the right directory." -ForegroundColor Red
    }
    
    Pop-Location
}
    
    Pop-Location
}

# Main logic
Write-Host "🤖 MCP Server Manager" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta

if ($Stop) {
    Stop-McpServer -StopPort $Port
} elseif ($Start) {
    Start-McpServer
} elseif ($Restart) {
    Stop-McpServer -StopPort $Port
    Start-Sleep -Seconds 2
    Start-McpServer
} else {
    # Default: Check status
    Write-Host "📊 Checking MCP server status..." -ForegroundColor Cyan
    
    $anyFound = $false
    for ($checkPort = 3000; $checkPort -le 3005; $checkPort++) {
        if (Test-McpServer -TestPort $checkPort) {
            $anyFound = $true
        }
    }
    
    if (-not $anyFound) {
        Write-Host ""
        Write-Host "💡 Server not running. Use these commands:" -ForegroundColor Yellow
        Write-Host "   Start:   .\mcp-health.ps1 -Start" -ForegroundColor White
        Write-Host "   Stop:    .\mcp-health.ps1 -Stop" -ForegroundColor White
        Write-Host "   Restart: .\mcp-health.ps1 -Restart" -ForegroundColor White
    }
}
}

Write-Host ""