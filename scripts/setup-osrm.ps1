# OSRM Setup Script for RideSync V2
# Downloads and prepares India map data for OSRM routing

Write-Host "Setting up OSRM for RideSync V2..." -ForegroundColor Cyan

# Create osrm_data directory if it doesn't exist
$osrmDataPath = ".\osrm_data"
if (-not (Test-Path $osrmDataPath)) {
    New-Item -ItemType Directory -Path $osrmDataPath -Force
    Write-Host "Created osrm_data directory" -ForegroundColor Green
}

# Download India map data from Geofabrik
$indiaMapUrl = "https://download.geofabrik.de/asia/india-latest.osm.pbf"
$indiaMapPath = Join-Path $osrmDataPath "india-latest.osm.pbf"

Write-Host "Downloading India map data (this may take a while)..." -ForegroundColor Yellow
if (-not (Test-Path $indiaMapPath)) {
    try {
        Invoke-WebRequest -Uri $indiaMapUrl -OutFile $indiaMapPath -UseBasicParsing
        Write-Host "Downloaded India map data successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to download India map data: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "India map data already exists" -ForegroundColor Green
}

# Note: OSRM preprocessing requires osrm-extract tool
# For production, you would run:
# osrm-extract -p /path/to/profile.lua india-latest.osm.pbf
# osrm-contract india-latest.osrm
# osrm-customize india-latest.osrm

Write-Host "OSRM setup complete!" -ForegroundColor Green
Write-Host "Note: For production deployment, run osrm-extract, osrm-contract, and osrm-customize on the map data." -ForegroundColor Yellow
Write-Host "For development, you can use a public OSRM server or download pre-processed .osrm files." -ForegroundColor Yellow
