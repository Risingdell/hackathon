# NL2SQL Project - Service Testing Script
# This script tests all API endpoints to verify the system is working correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NL2SQL Project - Service Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Function to run a test
function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )

    Write-Host "Testing: $TestName" -ForegroundColor Cyan

    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Body $jsonBody -TimeoutSec 10
        }

        Write-Host "[PASSED] $TestName" -ForegroundColor Green
        $respJson = $response | ConvertTo-Json -Compress
        Write-Host "  Response: $respJson" -ForegroundColor Gray
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "[FAILED] $TestName" -ForegroundColor Red
        $errMsg = $_.Exception.Message
        Write-Host "  Error: $errMsg" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Test 1: Python FastAPI Root Endpoint
Write-Host "[1/6] Testing Python FastAPI Root Endpoint" -ForegroundColor Yellow
if (Test-Endpoint -TestName "Python API Root" -Url "http://127.0.0.1:5001/") {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 2: Python FastAPI Health Endpoint
Write-Host "[2/6] Testing Python FastAPI Health Endpoint" -ForegroundColor Yellow
if (Test-Endpoint -TestName "Python API Health" -Url "http://127.0.0.1:5001/health") {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 3: Python FastAPI Generate SQL (Mock Mode)
Write-Host "[3/6] Testing Python FastAPI Generate SQL" -ForegroundColor Yellow
$nlQuery = @{
    nl_query = "Show all customers from New York"
}
if (Test-Endpoint -TestName "Python API Generate SQL" -Url "http://127.0.0.1:5001/generate-sql" -Method "POST" -Body $nlQuery) {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 4: Node.js Backend Health Check
Write-Host "[4/6] Testing Node.js Backend Health Check" -ForegroundColor Yellow
if (Test-Endpoint -TestName "Node.js Health Check" -Url "http://localhost:5000/api/sql/health") {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 5: Full Integration Test - Simple Query
Write-Host "[5/6] Testing Full Integration (NL to SQL to DB)" -ForegroundColor Yellow
$fullQuery = @{
    nl_query = "Show all customers"
}
if (Test-Endpoint -TestName "Full Integration Test" -Url "http://localhost:5000/api/sql/query" -Method "POST" -Body $fullQuery) {
    $testsPassed++
} else {
    $testsFailed++
}

# Test 6: Full Integration Test - Complex Query
Write-Host "[6/6] Testing Complex Query" -ForegroundColor Yellow
$complexQuery = @{
    nl_query = "Show all products in Electronics category"
}
if (Test-Endpoint -TestName "Complex Query Test" -Url "http://localhost:5000/api/sql/query" -Method "POST" -Body $complexQuery) {
    $testsPassed++
} else {
    $testsFailed++
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "[SUCCESS] All tests passed! Your NL2SQL system is working correctly." -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some tests failed. Please check the error messages above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Example Natural Language Queries" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Try these in your frontend:" -ForegroundColor White
Write-Host "  - Show all customers" -ForegroundColor Gray
Write-Host "  - Show all customers from New York" -ForegroundColor Gray
Write-Host "  - Show all products" -ForegroundColor Gray
Write-Host "  - Show all products in Electronics category" -ForegroundColor Gray
Write-Host "  - How many customers are there?" -ForegroundColor Gray
Write-Host "  - Show all orders" -ForegroundColor Gray
Write-Host "  - Show recent orders" -ForegroundColor Gray
Write-Host "  - Show products with price greater than 500" -ForegroundColor Gray
Write-Host ""
