# PowerShell script to download water purifier category images
# Run this script from the Yelooo directory

$imagesDir = ".\backend\ECommerceApi\wwwroot\images\categories"

# Create directory if it doesn't exist
if (-not (Test-Path $imagesDir)) {
    New-Item -ItemType Directory -Path $imagesDir -Force
    Write-Host "Created directory: $imagesDir"
}

# Define images to download (using placeholder images from Unsplash)
$images = @{
    "domestic-water-purifier.jpg" = "https://images.unsplash.com/photo-1585687433141-694dd0c69ce4?w=400&h=300&fit=crop"
    "commercial-water-purifier.jpg" = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
    "industrial-water-purifier.jpg" = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop"
    "premium-water-purifier.jpg" = "https://images.unsplash.com/photo-1624958723474-c3c8d8cba6ce?w=400&h=300&fit=crop"
    "regular-water-purifier.jpg" = "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop"
}

Write-Host "Downloading water purifier category images..."
Write-Host ""

foreach ($image in $images.GetEnumerator()) {
    $filePath = Join-Path $imagesDir $image.Key
    
    try {
        Write-Host "Downloading: $($image.Key)..."
        Invoke-WebRequest -Uri $image.Value -OutFile $filePath -ErrorAction Stop
        Write-Host "  Saved to: $filePath" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed to download: $($_.Exception.Message)" -ForegroundColor Red
        
        # Create a placeholder file
        Write-Host "  Creating placeholder..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Images saved to: $imagesDir"
Write-Host ""
Write-Host "Note: If downloads failed, you can manually add images with these names:"
$images.Keys | ForEach-Object { Write-Host "  - $_" }
