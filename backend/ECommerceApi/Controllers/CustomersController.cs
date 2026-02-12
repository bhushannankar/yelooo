using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Controllers
{
    /// <summary>
    /// Admin API to list customers (minimal details: name, address, city, pin, mobile, email).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all customers with minimal details: name, address, city, pin code, mobile, email.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomers()
        {
            var customers = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Customer")
                .OrderBy(u => u.FullName ?? u.Username)
                .Select(u => new
                {
                    userId = u.UserId,
                    name = u.FullName ?? u.Username,
                    address = u.Address,
                    city = u.City,
                    pinCode = u.PinCode,
                    mobile = u.PhoneNumber,
                    email = u.Email
                })
                .ToListAsync();

            return Ok(customers);
        }
    }
}
