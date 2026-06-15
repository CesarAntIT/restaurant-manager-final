namespace Application.Dtos.User
{
    public class LoginResponseForApiDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public int ExpiresIn { get; set; } = 3600;
        public UserSessionDto User { get; set; } = null!;

        public bool HasError { get; set; }
        public List<string> Errors { get; set; } = [];
    }

    public class UserSessionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
