using Application.Dtos.User;

namespace Application.Interfaces
{
    public interface IBaseUserAccountService
    {
        Task<UserResponseDto> ConfirmAccountAsync(string userId, string token);
        Task<UserResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<UserResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task<List<UserDto>> GetAllUser(bool? isActive = true);
        Task<UserDto?> GetUserByEmail(string email);
        Task<UserDto?> GetUserById(string Id);
        Task<UserDto?> GetUserByUserName(string userName);
        //Task<UserResponseDto> DeleteAsync(string id);
        //Task<EditResponseDto> EditUser(SaveUserDto saveDto, string? origin, bool? isCreated = false);
        //Task<RegisterResponseDto> RegisterUser(SaveUserDto saveDto, string? origin, bool? isApi = false);
    }
}