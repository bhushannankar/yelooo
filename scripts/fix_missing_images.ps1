$ImageDir = 'C:\Users\Dhruti\Documents\Uttishta\Yelooo\backend\ECommerceApi\wwwroot\images\products'

# Fix failed images with alternative URLs
$FailedImages = @{
    'polo.jpg' = 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500'
    'toothbrush.jpg' = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500'
    'probiotics.jpg' = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500'
    'almond-butter.jpg' = 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=500'
}

Write-Host "Downloading missing images..." -ForegroundColor Cyan

foreach ($item in $FailedImages.GetEnumerator()) {
    $filepath = Join-Path $ImageDir $item.Key
    Write-Host "Downloading $($item.Key)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $item.Value -OutFile $filepath -ErrorAction Stop
        Write-Host ' Done' -ForegroundColor Green
    }
    catch {
        Write-Host " Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All missing images downloaded!" -ForegroundColor Cyan
