param(
  [Parameter(Mandatory = $true)]
  [string]$Bucket,
  [string]$DistributionId = "",
  [string]$ApiUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"

Push-Location $Frontend
if ($ApiUrl) {
  $env:PUBLIC_API_URL = $ApiUrl
}
npm ci
npm run build
Pop-Location

$Dist = Join-Path $Frontend "dist"
Write-Host "Sincronizando $Dist -> s3://$Bucket ..."
aws s3 sync $Dist "s3://$Bucket" --delete

if ($DistributionId) {
  Write-Host "Invalidando CloudFront $DistributionId ..."
  aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
}

Write-Host "Frontend desplegado."
