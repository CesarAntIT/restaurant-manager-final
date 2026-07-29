using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixReviewFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Restaurants_RestaurantId1",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_RestaurantId1",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RestaurantId1",
                table: "Reviews");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RestaurantId1",
                table: "Reviews",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RestaurantId1",
                table: "Reviews",
                column: "RestaurantId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Restaurants_RestaurantId1",
                table: "Reviews",
                column: "RestaurantId1",
                principalTable: "Restaurants",
                principalColumn: "Id");
        }
    }
}
