foreach ($port in @(3000, 8000)) {
  $lines = netstat -ano | Select-String ":$port\s"
  foreach ($line in $lines) {
    $parts = ($line.Line.Trim() -split '\s+')
    $procId = $parts[-1]
    if ($procId -match '^\d+$' -and $procId -ne '0') {
      try { Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue; Write-Host "Killed PID $procId on port $port" } catch {}
    }
  }
}
Write-Host "All servers stopped."
