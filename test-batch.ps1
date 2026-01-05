$body = @{
    stgNum = '01'
    startTime = [long](Get-Date -UFormat %s) * 1000
} | ConvertTo-Json

Write-Host "Testing batch creation..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod `
        -Uri 'http://127.0.0.1:3000/api/batches' `
        -Method POST `
        -ContentType 'application/json' `
        -Body $body
    
    Write-Host "Success!"
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response.StatusCode)"
}
