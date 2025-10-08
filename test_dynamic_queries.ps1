# Test Dynamic Query Generation
# This script tests the enhanced NL2SQL generator with various dynamic queries

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Dynamic Query Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$queries = @(
    "Fetch all details on the customer",
    "Show customers from New York",
    "Get customers in Chicago",
    "Products with price greater than 500",
    "Show products in Electronics category",
    "How many customers are there?",
    "Show recent orders",
    "Products price between 100 and 500",
    "Show available electronics under 700",
    "Count products in furniture category",
    "Average price of products",
    "Show customer orders",
    "Latest 5 orders",
    "Products in stock",
    "Customers with email containing example"
)

$testNum = 1
$successCount = 0
$failCount = 0

foreach ($query in $queries) {
    Write-Host "[$testNum/$($queries.Count)] Testing: " -NoNewline -ForegroundColor Yellow
    Write-Host $query -ForegroundColor White

    try {
        $body = @{
            nl_query = $query
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://127.0.0.1:5001/generate-sql" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 5

        Write-Host "  [OK] SQL: " -NoNewline -ForegroundColor Green
        Write-Host $response.sql -ForegroundColor Gray
        $successCount++
    }
    catch {
        Write-Host "  [FAILED] " -NoNewline -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        $failCount++
    }

    Write-Host ""
    $testNum++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($queries.Count)" -ForegroundColor White
Write-Host "Passed: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "[SUCCESS] All dynamic queries working perfectly!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some tests failed. Make sure Python service is running on port 5001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To test with full database execution:" -ForegroundColor Cyan
Write-Host "  Change URL to: http://localhost:5000/api/sql/query" -ForegroundColor Gray
Write-Host ""
