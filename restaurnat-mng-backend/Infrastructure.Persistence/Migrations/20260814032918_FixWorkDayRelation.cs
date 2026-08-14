using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixWorkDayRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId1",
                table: "WorkDayItems");

            migrationBuilder.DropIndex(
                name: "IX_WorkDayItems_DishId1",
                table: "WorkDayItems");

            migrationBuilder.DropColumn(
                name: "DishId1",
                table: "WorkDayItems");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Menus",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DishId1",
                table: "WorkDayItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Menus",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkDayItems_DishId1",
                table: "WorkDayItems",
                column: "DishId1");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId1",
                table: "WorkDayItems",
                column: "DishId1",
                principalTable: "Dishes",
                principalColumn: "Id");
        }
    }
}
