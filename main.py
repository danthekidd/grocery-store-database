import os
import sqlite3

from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, IntPrompt, FloatPrompt, Confirm


class GroceryApp:
    DB_PATH = "db/grocery.db"
    SCHEMA_PATH = "schema.sql"

    def __init__(self):
        self.console = Console(highlight=False)
        self._make_db_folder()
        self.initialize_database()

    def run(self):
        self.main_menu()

    def _make_db_folder(self):
        db_dir = os.path.dirname(self.DB_PATH)
        os.makedirs(db_dir, exist_ok=True)

    def _clear_screen(self):
        os.system("cls" if os.name == "nt" else "clear")

    def _pause(self):
        self.console.print()
        Prompt.ask("Press Enter to continue", default="")

    def get_connection(self):
        conn = sqlite3.connect(self.DB_PATH)
        cursor = conn.cursor()
        return conn, cursor

    def initialize_database(self):
        conn, cursor = self.get_connection()
        try:
            with open(self.SCHEMA_PATH, "r", encoding="utf-8") as f:
                cursor.executescript(f.read())
            conn.commit()
        finally:
            conn.close()

    def main_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Grocery Store App[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Products")
            self.console.print("[dim]2.[/dim] Customers")
            self.console.print("[dim]3.[/dim] Orders")
            self.console.print("[dim]4.[/dim] Reports")
            self.console.print("[dim]5.[/dim] Exit")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4", "5"]
            )

            if choice == "1":
                self.product_menu()
            elif choice == "2":
                self.customer_menu()
            elif choice == "3":
                self.order_menu()
            elif choice == "4":
                self.report_menu()
            elif choice == "5":
                break

    def product_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Product Menu[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Add Product")
            self.console.print("[dim]2.[/dim] View Products")
            self.console.print("[dim]3.[/dim] Delete Product")
            self.console.print("[dim]4.[/dim] Add Category")
            self.console.print("[dim]5.[/dim] View Categories")
            self.console.print("[dim]6.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4", "5", "6"],
            )

            if choice == "1":
                self.add_product()
            elif choice == "2":
                self.view_products()
            elif choice == "3":
                self.delete_product()
            elif choice == "4":
                self.add_category()
            elif choice == "5":
                self.view_categories()
            elif choice == "6":
                break
    def no_menu(self):
        self._clear_screen()
        self.console.print("[red]Customer menu not built yet.[/red]")
        self._pause()

    def customer_menu(self):
        while True:
            self._clear_screen()
            self.console.rule("[bold magenta]Customer Menu[/bold magenta]", style="magenta")

            self.console.print()
            self.console.print("[dim]1.[/dim] Add Customer")
            self.console.print("[dim]2.[/dim] View Customers")
            self.console.print("[dim]3.[/dim] Delete Customer")
            self.console.print("[dim]4.[/dim] Back")
            self.console.print()

            choice = Prompt.ask(
                choices=["1", "2", "3", "4"],
            )

            if choice == "1":
                self.add_customer()
            elif choice == "2":
                self.view_customers()
            elif choice == "3":
                self.delete_customer()
            elif choice == "4":
                break

    def order_menu(self):
        self.no_menu()

    def report_menu(self):
        self.no_menu()

    def add_customer(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Customer[/bold magenta]", style="magenta")
        
        self.console.print()

        first_name = Prompt.ask("First name").strip()
        last_name = Prompt.ask("Last name").strip()
        phone = Prompt.ask("Phone").strip()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                INSERT INTO customers (first_name, last_name, phone)
                VALUES (?, ?, ?)
            """, (first_name, last_name, phone))
            conn.commit()
            self.console.print("[bold green]Customer added successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_customers(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Customers[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                SELECT customer_id, first_name, last_name, phone
                FROM customers
                ORDER BY customer_id
            """)
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No Customers found.[/red]")
        else:
            table = Table(title="Products", show_lines=True)
            table.add_column("Customer ID", justify="right")
            table.add_column("First Name")
            table.add_column("Last Name")
            table.add_column("Phone Number")

            for row in rows:
                table.add_row(str(row[0]), row[1], row[2], row[3])

            self.console.print(table)

        self._pause()

    def add_product(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Product[/bold magenta]", style="magenta")

        self.console.print()

        sku = Prompt.ask("SKU").strip()
        product_name = Prompt.ask("Product name").strip()
        price = FloatPrompt.ask("Price")
        stock_quantity = IntPrompt.ask("Stock quantity")

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                INSERT INTO products (sku, product_name, price, stock_quantity)
                VALUES (?, ?, ?, ?)
            """, (sku, product_name, price, stock_quantity))
            conn.commit()
            self.console.print("[bold green]Product added successfully.[/bold green]")
        except sqlite3.IntegrityError:
            self.console.print("[red]That SKU already exists.[/red]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_products(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Products[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute("""
                SELECT product_id, sku, product_name, price, stock_quantity
                FROM products
                ORDER BY product_id
            """)
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No products found.[/red]")
        else:
            table = Table(title="Products", show_lines=True)
            table.add_column("ID", justify="right")
            table.add_column("SKU")
            table.add_column("Name")
            table.add_column("Price", justify="right")
            table.add_column("Stock", justify="right")

            for row in rows:
                table.add_row(str(row[0]), row[1], row[2], f"${row[3]:.2f}", str(row[4]))

            self.console.print(table)

        self._pause()

    def delete_product(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Delete Product[/bold magenta]", style="magenta")

        self.console.print()

        product_id = IntPrompt.ask("Enter product ID to delete")

        confirm = Confirm.ask("Are you sure you want to delete this product?", default=False)
        if not confirm:
            self.console.print("[yellow]Delete cancelled.[/yellow]")
            self._pause()
            return

        conn, cursor = self.get_connection()
        try:
            cursor.execute("DELETE FROM products WHERE product_id = ?", (product_id,))
            conn.commit()

            if cursor.rowcount == 0:
                self.console.print("[yellow]No product found with that ID.[/yellow]")
            else:
                self.console.print("[bold green]Product deleted successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def add_category(self):
        self._clear_screen()
        self.console.rule("[bold magenta]Add Category[/bold magenta]", style="magenta")

        self.console.print()
        category_name = Prompt.ask("Category name").strip()

        if not category_name:
            self.console.print("[red]Category name cannot be empty.[/red]")
            self._pause()
            return

        if len(category_name) > 50:
            self.console.print("[red]Category name must be 50 characters or fewer.[/red]")
            self._pause()
            return

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT 1
                FROM categories
                WHERE LOWER(category_name) = LOWER(?)
                LIMIT 1
                """,
                (category_name,),
            )
            if cursor.fetchone() is not None:
                self.console.print("[yellow]That category already exists.[/yellow]")
                self._pause()
                return

            cursor.execute(
                """
                INSERT INTO categories (category_name)
                VALUES (?)
                """,
                (category_name,),
            )
            conn.commit()
            self.console.print("[bold green]Category added successfully.[/bold green]")
        except sqlite3.Error as e:
            self.console.print(f"[red]Database error:[/red] {e}")
        finally:
            conn.close()

        self._pause()

    def view_categories(self):
        self._clear_screen()
        self.console.rule("[bold magenta]All Categories[/bold magenta]", style="magenta")

        self.console.print()

        conn, cursor = self.get_connection()
        try:
            cursor.execute(
                """
                SELECT category_id, category_name
                FROM categories
                ORDER BY category_name
                """
            )
            rows = cursor.fetchall()
        finally:
            conn.close()

        if not rows:
            self.console.print("[red]No categories found.[/red]")
        else:
            table = Table(title="Categories", show_lines=True)
            table.add_column("ID", justify="right")
            table.add_column("Category Name")

            for row in rows:
                table.add_row(str(row[0]), row[1])

            self.console.print(table)

        self._pause()


if __name__ == "__main__":
    app = GroceryApp()
    app.run()