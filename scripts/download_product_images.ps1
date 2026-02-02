# PowerShell Script to Download Product Images
# Run this script to download images locally instead of using Unsplash URLs
# Images will be saved to: backend/ECommerceApi/wwwroot/images/products/

$ImageDir = "C:\Users\Dhruti\Documents\Uttishta\Yelooo\backend\ECommerceApi\wwwroot\images\products"

# Create directory if it doesn't exist
if (-not (Test-Path $ImageDir)) {
    New-Item -ItemType Directory -Path $ImageDir -Force
}

# Image URLs and their local filenames
$Images = @{
    # Electronics
    "smart-tv.jpg" = "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500"
    "headphones.jpg" = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
    "macbook.jpg" = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"
    "speaker.jpg" = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"
    "camera.jpg" = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500"
    
    # Household
    "vacuum.jpg" = "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500"
    "instant-pot.jpg" = "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500"
    "air-fryer.jpg" = "https://images.unsplash.com/photo-1626509653291-18d9a934b9db?w=500"
    "mixer.jpg" = "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500"
    "air-purifier.jpg" = "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500"
    
    # Men's Wear
    "jeans.jpg" = "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
    "tshirt.jpg" = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
    "polo.jpg" = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500"
    "blazer.jpg" = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500"
    "track-pants.jpg" = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500"
    
    # Women's Wear
    "maxi-dress.jpg" = "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"
    "sweater.jpg" = "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500"
    "women-blazer.jpg" = "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500"
    "bohemian-top.jpg" = "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500"
    "yoga-leggings.jpg" = "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500"
    
    # Kid's Wear
    "pajamas.jpg" = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500"
    "kids-hoodie.jpg" = "https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=500"
    "overalls.jpg" = "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500"
    "party-dress.jpg" = "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500"
    "kids-sneakers.jpg" = "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500"
    
    # Footwear
    "air-max.jpg" = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
    "ultraboost.jpg" = "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500"
    "boots.jpg" = "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500"
    "heels.jpg" = "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500"
    "sandals.jpg" = "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500"
    
    # Luggage & Bags
    "carry-on.jpg" = "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500"
    "backpack.jpg" = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"
    "laptop-bag.jpg" = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500"
    "tote-bag.jpg" = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500"
    "suitcase.jpg" = "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=500"
    
    # Food & Grocery
    "olive-oil.jpg" = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500"
    "honey.jpg" = "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"
    "quinoa.jpg" = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500"
    "almond-butter.jpg" = "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=500"
    "chocolate.jpg" = "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500"
    
    # Health Care
    "vitamins.jpg" = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500"
    "fish-oil.jpg" = "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=500"
    "probiotics.jpg" = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
    "first-aid.jpg" = "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500"
    "bp-monitor.jpg" = "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500"
    
    # Personal Care
    "moisturizer.jpg" = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500"
    "hair-treatment.jpg" = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500"
    "toothbrush.jpg" = "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500"
    "sunscreen.jpg" = "https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=500"
    "body-wash.jpg" = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500"
}

Write-Host "Downloading product images to: $ImageDir" -ForegroundColor Cyan
Write-Host ""

$total = $Images.Count
$current = 0

foreach ($item in $Images.GetEnumerator()) {
    $current++
    $filename = $item.Key
    $url = $item.Value
    $filepath = Join-Path $ImageDir $filename
    
    Write-Host "[$current/$total] Downloading $filename..." -NoNewline
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $filepath -ErrorAction Stop
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Cyan
Write-Host "Images saved to: $ImageDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the SQL script: db/seed_dummy_products_local.sql" -ForegroundColor White
Write-Host "2. This will use local image paths instead of Unsplash URLs" -ForegroundColor White
