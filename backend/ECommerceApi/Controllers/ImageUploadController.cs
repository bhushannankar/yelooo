using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageUploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ImageUploadController> _logger;
        
        // Allowed image extensions
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        
        // Max file size: 5MB
        private const long MaxFileSize = 5 * 1024 * 1024;

        public ImageUploadController(IWebHostEnvironment environment, ILogger<ImageUploadController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Upload a category image for shop page. Returns the URL path to the uploaded image.
        /// </summary>
        [HttpPost("category")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadCategoryImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");
            if (file.Length > MaxFileSize)
                return BadRequest($"File size exceeds the maximum limit of {MaxFileSize / (1024 * 1024)}MB.");
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
                return BadRequest($"Invalid file type. Allowed: {string.Join(", ", _allowedExtensions)}");
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest("Invalid content type. Only image files are allowed.");
            try
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "categories");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                    await file.CopyToAsync(stream);
                var imageUrl = $"/uploads/categories/{uniqueFileName}";
                _logger.LogInformation("Category image uploaded: {ImageUrl}", imageUrl);
                return Ok(new { imageUrl, fileName = uniqueFileName, originalFileName = file.FileName, size = file.Length });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading category image");
                return StatusCode(500, "An error occurred while uploading the image.");
            }
        }

        /// <summary>
        /// Upload a product image. Returns the URL path to the uploaded image.
        /// </summary>
        [HttpPost("product")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadProductImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            // Validate file size
            if (file.Length > MaxFileSize)
            {
                return BadRequest($"File size exceeds the maximum limit of {MaxFileSize / (1024 * 1024)}MB.");
            }

            // Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", _allowedExtensions)}");
            }

            // Validate content type
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return BadRequest("Invalid content type. Only image files are allowed.");
            }

            try
            {
                // Create uploads directory if it doesn't exist
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products");
                
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename to prevent overwrites
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return the relative URL path
                var imageUrl = $"/uploads/products/{uniqueFileName}";
                
                _logger.LogInformation("Image uploaded successfully: {ImageUrl}", imageUrl);

                return Ok(new { 
                    imageUrl = imageUrl,
                    fileName = uniqueFileName,
                    originalFileName = file.FileName,
                    size = file.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image");
                return StatusCode(500, "An error occurred while uploading the image.");
            }
        }

        /// <summary>
        /// Upload multiple product images. Returns array of URL paths.
        /// </summary>
        [HttpPost("products/multiple")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadMultipleProductImages(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest("No files uploaded.");
            }

            if (files.Count > 10)
            {
                return BadRequest("Maximum 10 files allowed per upload.");
            }

            var results = new List<object>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                // Validate file size
                if (file.Length > MaxFileSize)
                {
                    errors.Add($"{file.FileName}: File size exceeds the maximum limit.");
                    continue;
                }

                // Validate file extension
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
                {
                    errors.Add($"{file.FileName}: Invalid file type.");
                    continue;
                }

                try
                {
                    var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products");
                    
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    results.Add(new
                    {
                        imageUrl = $"/uploads/products/{uniqueFileName}",
                        fileName = uniqueFileName,
                        originalFileName = file.FileName,
                        size = file.Length
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading image: {FileName}", file.FileName);
                    errors.Add($"{file.FileName}: Upload failed.");
                }
            }

            return Ok(new
            {
                uploaded = results,
                errors = errors
            });
        }

        /// <summary>
        /// Upload a receipt/bill image for offline transaction. Customer and Seller can use.
        /// </summary>
        [HttpPost("receipt")]
        [Authorize(Roles = "Customer,Seller")]
        public async Task<IActionResult> UploadReceiptImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest($"File size exceeds the maximum limit of {MaxFileSize / (1024 * 1024)}MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", _allowedExtensions)}");
            }

            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return BadRequest("Invalid content type. Only image files are allowed.");
            }

            try
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "receipts");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/receipts/{uniqueFileName}";
                _logger.LogInformation("Receipt uploaded successfully: {ImageUrl}", imageUrl);

                return Ok(new { imageUrl = imageUrl, fileName = uniqueFileName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading receipt");
                return StatusCode(500, "An error occurred while uploading the receipt.");
            }
        }

        /// <summary>
        /// Delete a product image by filename.
        /// </summary>
        [HttpDelete("product/{fileName}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteProductImage(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return BadRequest("Filename is required.");
            }

            // Sanitize filename to prevent directory traversal
            fileName = Path.GetFileName(fileName);
            
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products");
            var filePath = Path.Combine(uploadsFolder, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Image not found.");
            }

            try
            {
                System.IO.File.Delete(filePath);
                _logger.LogInformation("Image deleted: {FileName}", fileName);
                return Ok(new { message = "Image deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {FileName}", fileName);
                return StatusCode(500, "An error occurred while deleting the image.");
            }
        }
    }
}
