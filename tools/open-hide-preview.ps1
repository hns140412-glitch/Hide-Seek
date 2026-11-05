$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$serverScript = Join-Path $PSScriptRoot 'hide-local-preview.cjs'
$url = 'http://127.0.0.1:44771/'
$statusUrl = $url + '__hide_preview_status'
function Test-HidePreview {
  try {
    $status = Invoke-RestMethod -Uri $statusUrl -TimeoutSec 2
    return $status.service -eq 'HIDE_SEEK_LOCAL_PREVIEW_V1'
  } catch { return $false }
}
if (-not (Test-HidePreview)) {
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $scriptArg = '"' + $serverScript + '"'
  Start-Process -FilePath $node -ArgumentList @($scriptArg) -WorkingDirectory $project -WindowStyle Minimized
  $ready = $false
  for ($n = 0; $n -lt 24; $n++) {
    Start-Sleep -Milliseconds 250
    if (Test-HidePreview) { $ready = $true; break }
  }
  if (-not $ready) { throw 'Local preview could not start. Check Node.js and port 44771.' }
}
Start-Process $url
