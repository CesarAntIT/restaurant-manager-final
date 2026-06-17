using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IndexesAndRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DishIngredients_Menus_MenuId",
                table: "DishIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_DishIngredients_Menus_MenuId1",
                table: "DishIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDayItems_Menus_MenuId",
                table: "WorkDayItems");

            migrationBuilder.DropIndex(
                name: "IX_Ingredients_RestaurantId",
                table: "Ingredients");

            migrationBuilder.DropIndex(
                name: "IX_DishIngredients_MenuId1",
                table: "DishIngredients");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "MenuId1",
                table: "DishIngredients");

            migrationBuilder.RenameColumn(
                name: "MenuId",
                table: "WorkDayItems",
                newName: "DishId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkDayItems_MenuId",
                table: "WorkDayItems",
                newName: "IX_WorkDayItems_DishId");

            migrationBuilder.RenameColumn(
                name: "MenuId",
                table: "DishIngredients",
                newName: "DishId");

            migrationBuilder.AddColumn<int>(
                name: "DishId1",
                table: "WorkDayItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkDayId1",
                table: "WorkDayItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantId1",
                table: "Tables",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Dishes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dishes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuDishes",
                columns: table => new
                {
                    MenuId = table.Column<int>(type: "integer", nullable: false),
                    DishId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuDishes", x => new { x.DishId, x.MenuId });
                    table.ForeignKey(
                        name: "FK_MenuDishes_Dishes_DishId",
                        column: x => x.DishId,
                        principalTable: "Dishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuDishes_Menus_MenuId",
                        column: x => x.MenuId,
                        principalTable: "Menus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkDayItems_DishId1",
                table: "WorkDayItems",
                column: "DishId1");

            migrationBuilder.CreateIndex(
                name: "IX_WorkDayItems_WorkDayId1",
                table: "WorkDayItems",
                column: "WorkDayId1");

            migrationBuilder.CreateIndex(
                name: "IX_Tables_RestaurantId1",
                table: "Tables",
                column: "RestaurantId1");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_Category",
                table: "Restaurants",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_Name",
                table: "Restaurants",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_OwnerId",
                table: "Restaurants",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Ingredients_Name",
                table: "Ingredients",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Ingredients_RestaurantId_Name",
                table: "Ingredients",
                columns: new[] { "RestaurantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dishes_Name",
                table: "Dishes",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Dishes_RestaurantId_Name",
                table: "Dishes",
                columns: new[] { "RestaurantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuDishes_MenuId",
                table: "MenuDishes",
                column: "MenuId");

            migrationBuilder.AddForeignKey(
                name: "FK_DishIngredients_Dishes_DishId",
                table: "DishIngredients",
                column: "DishId",
                principalTable: "Dishes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_Restaurants_RestaurantId1",
                table: "Tables",
                column: "RestaurantId1",
                principalTable: "Restaurants",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId",
                table: "WorkDayItems",
                column: "DishId",
                principalTable: "Dishes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId1",
                table: "WorkDayItems",
                column: "DishId1",
                principalTable: "Dishes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDayItems_WorkDays_WorkDayId1",
                table: "WorkDayItems",
                column: "WorkDayId1",
                principalTable: "WorkDays",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DishIngredients_Dishes_DishId",
                table: "DishIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_Tables_Restaurants_RestaurantId1",
                table: "Tables");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId",
                table: "WorkDayItems");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDayItems_Dishes_DishId1",
                table: "WorkDayItems");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkDayItems_WorkDays_WorkDayId1",
                table: "WorkDayItems");

            migrationBuilder.DropTable(
                name: "MenuDishes");

            migrationBuilder.DropTable(
                name: "Dishes");

            migrationBuilder.DropIndex(
                name: "IX_WorkDayItems_DishId1",
                table: "WorkDayItems");

            migrationBuilder.DropIndex(
                name: "IX_WorkDayItems_WorkDayId1",
                table: "WorkDayItems");

            migrationBuilder.DropIndex(
                name: "IX_Tables_RestaurantId1",
                table: "Tables");

            migrationBuilder.DropIndex(
                name: "IX_Restaurants_Category",
                table: "Restaurants");

            migrationBuilder.DropIndex(
                name: "IX_Restaurants_Name",
                table: "Restaurants");

            migrationBuilder.DropIndex(
                name: "IX_Restaurants_OwnerId",
                table: "Restaurants");

            migrationBuilder.DropIndex(
                name: "IX_Ingredients_Name",
                table: "Ingredients");

            migrationBuilder.DropIndex(
                name: "IX_Ingredients_RestaurantId_Name",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "DishId1",
                table: "WorkDayItems");

            migrationBuilder.DropColumn(
                name: "WorkDayId1",
                table: "WorkDayItems");

            migrationBuilder.DropColumn(
                name: "RestaurantId1",
                table: "Tables");

            migrationBuilder.RenameColumn(
                name: "DishId",
                table: "WorkDayItems",
                newName: "MenuId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkDayItems_DishId",
                table: "WorkDayItems",
                newName: "IX_WorkDayItems_MenuId");

            migrationBuilder.RenameColumn(
                name: "DishId",
                table: "DishIngredients",
                newName: "MenuId");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Reviews",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Menus",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "MenuId1",
                table: "DishIngredients",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ingredients_RestaurantId",
                table: "Ingredients",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_DishIngredients_MenuId1",
                table: "DishIngredients",
                column: "MenuId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DishIngredients_Menus_MenuId",
                table: "DishIngredients",
                column: "MenuId",
                principalTable: "Menus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DishIngredients_Menus_MenuId1",
                table: "DishIngredients",
                column: "MenuId1",
                principalTable: "Menus",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkDayItems_Menus_MenuId",
                table: "WorkDayItems",
                column: "MenuId",
                principalTable: "Menus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
