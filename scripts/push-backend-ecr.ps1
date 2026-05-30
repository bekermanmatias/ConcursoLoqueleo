param(
  [Parameter(Mandatory = $true)]
  [string]$AccountId,
  [Parameter(Mandatory = $true)]
  [string]$Region,
  [string]$Repository = "loqueleo-api",
  [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ImageUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/${Repository}:$Tag"

Write-Host "Autenticando en ECR..."
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

Write-Host "Construyendo imagen backend..."
docker build -t "loqueleo-api:$Tag" "$Root/backend"
docker tag "loqueleo-api:$Tag" $ImageUri

Write-Host "Publicando $ImageUri ..."
docker push $ImageUri

Write-Host "Listo. Actualiza la Task Definition ECS con esta imagen."
