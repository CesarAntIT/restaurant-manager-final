using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Entities
{
    public class UserAccount : IdentityUser
    {
        public required string Name { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
