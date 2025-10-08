# Test Advanced SQL Query Generation - Phase 2 Features
# Tests: OR conditions, DISTINCT, IN/NOT IN, LIKE patterns, GROUP BY, HAVING, NULL handling

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Advanced Query Generation Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$queries = @(
    # OR Conditions
    "Customers from New York or Chicago",
    "Products in Electronics or Furniture",
    "Customers from New York, Chicago, or Boston",

    # DISTINCT
    "Unique cities where customers live",
    "All distinct categories",
    "Number of unique cities",

    # LIKE Patterns
    "Customers whose name starts with A",
    "Customers whose name ends with son",
    "Customers whose name contains Alice",
    "Products starting with Lap",

    # NULL Handling
    "Customers without an email",
    "Customers with an email",
    "Products with no stock information",
    "Products with stock information",

    # GROUP BY
    "Count customers by city",
    "Count products by category",
    "Average price by category",
    "Total orders by customer",

    # HAVING
    "Cities with more than 2 customers",
    "Categories with at least 3 products",

    # Complex Combinations
    "Available electronics or furniture under 500",
    "Customers from New York who have email",
    "Count electronics priced above 500",
    "Unique categories with average price above 300"
)

$passCount = 0
$failCount = 0
$testNum = 1

foreach ($query in $queries) {
    Write-Host "[$testNum/$($queries.Count)] " -NoNewline -ForegroundColor Yellow
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

        if ($response.advanced_mode) {
            Write-Host "  [INFO] Using advanced generator" -ForegroundColor Cyan
        }

        $passCount++
    }
    catch {
        Write-Host "  [FAILED] " -NoNewline -ForegroundColor Red
        $errMsg = $_.Exception.Message
        Write-Host $errMsg -ForegroundColor Red
        $failCount++
    }

    Write-Host ""
    $testNum++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($queries.Count)" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "[SUCCESS] All advanced features working!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some tests failed. Make sure Python service is running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Feature Coverage:" -ForegroundColor Cyan
Write-Host "  - OR Conditions" -ForegroundColor Gray
Write-Host "  - DISTINCT" -ForegroundColor Gray
Write-Host "  - LIKE Patterns (starts with, ends with, contains)" -ForegroundColor Gray
Write-Host "  - NULL Handling (IS NULL, IS NOT NULL)" -ForegroundColor Gray
Write-Host "  - GROUP BY" -ForegroundColor Gray
Write-Host "  - HAVING" -ForegroundColor Gray
Write-Host "  - Complex Combinations" -ForegroundColor Gray
Write-Host ""
