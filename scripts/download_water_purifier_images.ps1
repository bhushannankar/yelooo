# PowerShell script to download water purifier product images
# Run this script from the Yelooo directory

$imagesDir = ".\backend\ECommerceApi\wwwroot\images\products"

# Create directory if it doesn't exist
if (-not (Test-Path $imagesDir)) {
    New-Item -ItemType Directory -Path $imagesDir -Force
    Write-Host "Created directory: $imagesDir"
}

# Define images to download (using Unsplash for placeholder images)
$images = @{
    # Premium Domestic
    "water-purifier-premium-1.jpg" = "https://images.unsplash.com/photo-1624958723474-c3c8d8cba6ce?w=600&h=600&fit=crop"
    "water-purifier-premium-2.jpg" = "https://images.unsplash.com/photo-1585687433141-694dd0c69ce4?w=600&h=600&fit=crop"
    "water-purifier-premium-3.jpg" = "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&h=600&fit=crop"
    
    # Regular Domestic
    "water-purifier-regular-1.jpg" = "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=600&fit=crop"
    "water-purifier-regular-2.jpg" = "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&h=600&fit=crop"
    "water-purifier-regular-3.jpg" = "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop"
    
    # Commercial
    "water-purifier-commercial-1.jpg" = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
    "water-purifier-commercial-2.jpg" = "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&h=600&fit=crop"
    "water-purifier-commercial-3.jpg" = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=600&fit=crop"
    
    # Industrial
    "water-purifier-industrial-1.jpg" = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=600&fit=crop"
    "water-purifier-industrial-2.jpg" = "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&h=600&fit=crop"
    "water-purifier-industrial-3.jpg" = "https://images.unsplash.com/photo-1581093577421-f561a654a353?w=600&h=600&fit=crop"
}

Write-Host "Downloading water purifier product images..."
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($image in $images.GetEnumerator()) {
    $filePath = Join-Path $imagesDir $image.Key
    
    # Skip if file already exists
    if (Test-Path $filePath) {
        Write-Host "Skipping (exists): $($image.Key)" -ForegroundColor Yellow
        $successCount++
        continue
    }
    
    try {
        Write-Host "Downloading: $($image.Key)..."
        Invoke-WebRequest -Uri $image.Value -OutFile $filePath -ErrorAction Stop
        Write-Host "  Saved to: $filePath" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "  Failed to download: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Summary:" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Images saved to: $imagesDir"
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "Note: Some downloads failed. You can manually add images with these names:" -ForegroundColor Yellow
    $images.Keys | ForEach-Object { 
        $path = Join-Path $imagesDir $_
        if (-not (Test-Path $path)) {
            Write-Host "  - $_" -ForegroundColor Yellow
        }
    }
}
