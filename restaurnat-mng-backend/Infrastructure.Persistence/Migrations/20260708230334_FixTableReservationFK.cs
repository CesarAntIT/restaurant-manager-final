using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixTableReservationFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Tables_TableId1",
                table: "Reservations");

            migrationBuilder.DropForeignKey(
                name: "FK_Tables_Restaurants_RestaurantId1",
                table: "Tables");

            migrationBuilder.DropIndex(
                name: "IX_Tables_RestaurantId1",
                table: "Tables");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_TableId1",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "RestaurantId1",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "TableId1",
                table: "Reservations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RestaurantId1",
                table: "Tables",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TableId1",
                table: "Reservations",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tables_RestaurantId1",
                table: "Tables",
                column: "RestaurantId1");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_TableId1",
                table: "Reservations",
                column: "TableId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_Tables_TableId1",
                table: "Reservations",
                column: "TableId1",
                principalTable: "Tables",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_Restaurants_RestaurantId1",
                table: "Tables",
                column: "RestaurantId1",
                principalTable: "Restaurants",
                principalColumn: "Id");
        }
    }
}
