try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/health' -UseBasicParsing -TimeoutSec 5
    Write-Output $r.Content
} catch {
    Write-Output 'ERROR'
    Write-Output $error[0].Exception.Message
}