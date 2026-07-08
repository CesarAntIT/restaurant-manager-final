using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TriggerPromedioRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
            CREATE OR REPLACE FUNCTION actualizar_promedio_restaurante()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE ""Restaurants""
                SET ""PromedioRating"" = (
                SELECT ROUND(COALESCE(AVG(""Rating""), 0), 1)
                FROM ""Reviews""
                WHERE ""RestaurantId"" = NEW.""RestaurantId""
            )
                WHERE ""Id"" = NEW.""RestaurantId"";
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER trigger_actualizar_rating
                AFTER INSERT OR UPDATE OR DELETE ON ""Reviews""
                FOR EACH ROW
                EXECUTE PROCEDURE actualizar_promedio_restaurante();
        ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trigger_actualizar_rating ON \"Reviews\";");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS actualizar_promedio_restaurante();");
        }
    }
}
